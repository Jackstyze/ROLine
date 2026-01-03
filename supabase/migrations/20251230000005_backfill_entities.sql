-- =============================================================================
-- Migration: Backfill Entities Table
-- Description: Populate entities table with existing products/events/coupons
-- Author: CTK AI System
-- Date: 2025-12-30
-- =============================================================================
--
-- PURPOSE:
-- Initial population of the entities table with existing data.
-- Future inserts/updates are handled by triggers.
--
-- IDEMPOTENCY:
-- Uses ON CONFLICT DO NOTHING - safe to run multiple times.
--
-- NOTE: Embeddings are NULL initially and will be populated by background worker.
-- =============================================================================

-- Disable triggers during backfill (performance optimization)
ALTER TABLE products DISABLE TRIGGER trg_product_entity_sync;
ALTER TABLE events DISABLE TRIGGER trg_event_entity_sync;
ALTER TABLE coupons DISABLE TRIGGER trg_coupon_entity_sync;

-- =============================================================================
-- BACKFILL PRODUCTS
-- =============================================================================

INSERT INTO entities (
  entity_type,
  source_id,
  title,
  title_ar,
  description,
  search_text,
  category_id,
  wilaya_id,
  merchant_id,
  price,
  is_promoted,
  is_featured,
  content_hash,
  created_at,
  updated_at
)
SELECT
  'product'::entity_type,
  p.id,
  p.title,
  p.title_ar,
  p.description,
  build_entity_search_text(
    'product'::entity_type,
    p.title,
    p.title_ar,
    p.description,
    NULL
  ),
  p.category_id,
  p.wilaya_id,
  p.merchant_id,
  p.price,
  COALESCE(p.is_promoted, FALSE),
  FALSE,
  compute_entity_content_hash(p.title, p.title_ar, p.description, p.category_id),
  COALESCE(p.created_at, NOW()),
  COALESCE(p.updated_at, NOW())
FROM products p
WHERE p.status = 'active'
ON CONFLICT (entity_type, source_id) DO NOTHING;

-- Log count
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM entities WHERE entity_type = 'product';
  RAISE NOTICE 'Backfilled % products into entities table', v_count;
END $$;

-- =============================================================================
-- BACKFILL EVENTS
-- =============================================================================

INSERT INTO entities (
  entity_type,
  source_id,
  title,
  title_ar,
  description,
  search_text,
  category_id,
  wilaya_id,
  merchant_id,
  price,
  is_promoted,
  is_featured,
  content_hash,
  created_at,
  updated_at
)
SELECT
  'event'::entity_type,
  e.id,
  e.title,
  e.title_ar,
  e.description,
  build_entity_search_text(
    'event'::entity_type,
    e.title,
    e.title_ar,
    e.description,
    e.location_name
  ),
  e.category_id,
  e.wilaya_id,
  e.organizer_id,  -- Events use organizer_id
  e.price,
  COALESCE(e.promotion_tier IS NOT NULL, FALSE),
  COALESCE(e.is_featured, FALSE),
  md5(
    COALESCE(e.title, '') || '|' ||
    COALESCE(e.title_ar, '') || '|' ||
    COALESCE(e.description, '') || '|' ||
    COALESCE(e.category_id::TEXT, '') || '|' ||
    COALESCE(e.location_name, '')
  ),
  COALESCE(e.created_at, NOW()),
  COALESCE(e.updated_at, NOW())
FROM events e
WHERE COALESCE(e.is_active, FALSE) = TRUE
ON CONFLICT (entity_type, source_id) DO NOTHING;

-- Log count
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM entities WHERE entity_type = 'event';
  RAISE NOTICE 'Backfilled % events into entities table', v_count;
END $$;

-- =============================================================================
-- BACKFILL COUPONS
-- =============================================================================

INSERT INTO entities (
  entity_type,
  source_id,
  title,
  title_ar,
  description,
  search_text,
  category_id,
  wilaya_id,
  merchant_id,
  price,
  is_promoted,
  is_featured,
  content_hash,
  created_at,
  updated_at
)
SELECT
  'coupon'::entity_type,
  c.id,
  c.title,
  c.title_ar,
  c.description,
  build_entity_search_text(
    'coupon'::entity_type,
    c.title,
    c.title_ar,
    c.description,
    c.code
  ),
  NULL,  -- Coupons don't have direct category_id
  NULL,  -- Coupons use coupon_rules for wilaya targeting
  c.merchant_id,
  NULL,  -- Coupons have discount_value, not price
  COALESCE(c.promotion_tier IS NOT NULL, FALSE),
  COALESCE(c.is_featured, FALSE),
  md5(
    COALESCE(c.title, '') || '|' ||
    COALESCE(c.title_ar, '') || '|' ||
    COALESCE(c.description, '') || '|' ||
    COALESCE(c.code, '')
  ),
  COALESCE(c.created_at, NOW()),
  COALESCE(c.updated_at, NOW())
FROM coupons c
WHERE COALESCE(c.is_active, FALSE) = TRUE
  AND COALESCE(c.is_public, FALSE) = TRUE
ON CONFLICT (entity_type, source_id) DO NOTHING;

-- Log count
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM entities WHERE entity_type = 'coupon';
  RAISE NOTICE 'Backfilled % coupons into entities table', v_count;
END $$;

-- =============================================================================
-- RE-ENABLE TRIGGERS
-- =============================================================================

ALTER TABLE products ENABLE TRIGGER trg_product_entity_sync;
ALTER TABLE events ENABLE TRIGGER trg_event_entity_sync;
ALTER TABLE coupons ENABLE TRIGGER trg_coupon_entity_sync;

-- =============================================================================
-- FINAL SUMMARY
-- =============================================================================

DO $$
DECLARE
  v_total INTEGER;
  v_products INTEGER;
  v_events INTEGER;
  v_coupons INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM entities;
  SELECT COUNT(*) INTO v_products FROM entities WHERE entity_type = 'product';
  SELECT COUNT(*) INTO v_events FROM entities WHERE entity_type = 'event';
  SELECT COUNT(*) INTO v_coupons FROM entities WHERE entity_type = 'coupon';

  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'ENTITIES BACKFILL COMPLETE';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Total entities: %', v_total;
  RAISE NOTICE '  - Products: %', v_products;
  RAISE NOTICE '  - Events: %', v_events;
  RAISE NOTICE '  - Coupons: %', v_coupons;
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Embeddings: 0 (pending async population via Cohere API)';
  RAISE NOTICE '=====================================================';
END $$;

-- =============================================================================
-- REBUILD IVFFLAT INDEX (Recommended after bulk insert)
-- =============================================================================

-- Note: IVFFlat index quality depends on data distribution.
-- After backfill, it's recommended to rebuild the index.
-- This is done automatically when embeddings are populated.

-- For now, we skip this since embeddings are NULL.
-- Uncomment when embeddings are populated:
--
-- REINDEX INDEX idx_entities_embedding_ivfflat;
