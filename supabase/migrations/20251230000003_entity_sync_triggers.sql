-- =============================================================================
-- Migration: Entity Sync Triggers
-- Description: Automatic sync from products/events/coupons to entities table
-- Author: CTK AI System
-- Date: 2025-12-30
-- =============================================================================
--
-- TRIGGER BEHAVIOR:
-- - Products: Sync when status = 'active'
-- - Events: Sync when is_active = true
-- - Coupons: Sync when is_active = true AND is_public = true
--
-- CHANGE DETECTION:
-- - Uses content_hash (MD5) to detect meaningful changes
-- - Prevents unnecessary updates and re-embedding
--
-- SECURITY:
-- - SECURITY DEFINER allows triggers to bypass RLS on entities table
-- =============================================================================

-- =============================================================================
-- PRODUCT SYNC TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_product_to_entities()
RETURNS TRIGGER AS $$
DECLARE
  v_content_hash TEXT;
  v_search_text TEXT;
  v_should_exist BOOLEAN;
BEGIN
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    DELETE FROM entities
    WHERE entity_type = 'product' AND source_id = OLD.id;
    RETURN OLD;
  END IF;

  -- Determine if entity should exist (only active products)
  v_should_exist := (NEW.status = 'active');

  IF NOT v_should_exist THEN
    -- Remove entity if status changed to non-active
    DELETE FROM entities
    WHERE entity_type = 'product' AND source_id = NEW.id;
    RETURN NEW;
  END IF;

  -- Compute content hash for change detection
  v_content_hash := compute_entity_content_hash(
    NEW.title,
    NEW.title_ar,
    NEW.description,
    NEW.category_id
  );

  -- Build search text (product-specific)
  v_search_text := build_entity_search_text(
    'product'::entity_type,
    NEW.title,
    NEW.title_ar,
    NEW.description,
    NULL  -- No extra fields for products
  );

  -- Upsert entity
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
  ) VALUES (
    'product',
    NEW.id,
    NEW.title,
    NEW.title_ar,
    NEW.description,
    v_search_text,
    NEW.category_id,
    NEW.wilaya_id,
    NEW.merchant_id,
    NEW.price,
    COALESCE(NEW.is_promoted, FALSE),
    FALSE,  -- Products don't have is_featured
    v_content_hash,
    COALESCE(NEW.created_at, NOW()),
    NOW()
  )
  ON CONFLICT (entity_type, source_id) DO UPDATE SET
    title = EXCLUDED.title,
    title_ar = EXCLUDED.title_ar,
    description = EXCLUDED.description,
    search_text = EXCLUDED.search_text,
    category_id = EXCLUDED.category_id,
    wilaya_id = EXCLUDED.wilaya_id,
    merchant_id = EXCLUDED.merchant_id,
    price = EXCLUDED.price,
    is_promoted = EXCLUDED.is_promoted,
    content_hash = EXCLUDED.content_hash,
    updated_at = NOW(),
    -- Keep existing embedding if content hash unchanged
    embedding = CASE
      WHEN entities.content_hash = EXCLUDED.content_hash
      THEN entities.embedding
      ELSE NULL  -- Clear embedding for re-generation
    END
  WHERE entities.content_hash != EXCLUDED.content_hash
     OR entities.is_promoted != EXCLUDED.is_promoted;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on products table
DROP TRIGGER IF EXISTS trg_product_entity_sync ON products;
CREATE TRIGGER trg_product_entity_sync
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_to_entities();

-- =============================================================================
-- EVENT SYNC TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_event_to_entities()
RETURNS TRIGGER AS $$
DECLARE
  v_content_hash TEXT;
  v_search_text TEXT;
  v_should_exist BOOLEAN;
  v_extra_text TEXT;
BEGIN
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    DELETE FROM entities
    WHERE entity_type = 'event' AND source_id = OLD.id;
    RETURN OLD;
  END IF;

  -- Determine if entity should exist (active events only)
  v_should_exist := COALESCE(NEW.is_active, FALSE);

  IF NOT v_should_exist THEN
    -- Remove entity if event became inactive
    DELETE FROM entities
    WHERE entity_type = 'event' AND source_id = NEW.id;
    RETURN NEW;
  END IF;

  -- Compute content hash for change detection
  -- Include location_name for events (changes affect search relevance)
  v_content_hash := md5(
    COALESCE(NEW.title, '') || '|' ||
    COALESCE(NEW.title_ar, '') || '|' ||
    COALESCE(NEW.description, '') || '|' ||
    COALESCE(NEW.category_id::TEXT, '') || '|' ||
    COALESCE(NEW.location_name, '')
  );

  -- Build search text (event-specific: include location)
  v_extra_text := NEW.location_name;
  v_search_text := build_entity_search_text(
    'event'::entity_type,
    NEW.title,
    NEW.title_ar,
    NEW.description,
    v_extra_text
  );

  -- Upsert entity
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
  ) VALUES (
    'event',
    NEW.id,
    NEW.title,
    NEW.title_ar,
    NEW.description,
    v_search_text,
    NEW.category_id,
    NEW.wilaya_id,
    NEW.organizer_id,  -- Events use organizer_id, not merchant_id
    NEW.price,  -- May be NULL for free events
    COALESCE(NEW.promotion_tier IS NOT NULL, FALSE),
    COALESCE(NEW.is_featured, FALSE),
    v_content_hash,
    COALESCE(NEW.created_at, NOW()),
    NOW()
  )
  ON CONFLICT (entity_type, source_id) DO UPDATE SET
    title = EXCLUDED.title,
    title_ar = EXCLUDED.title_ar,
    description = EXCLUDED.description,
    search_text = EXCLUDED.search_text,
    category_id = EXCLUDED.category_id,
    wilaya_id = EXCLUDED.wilaya_id,
    merchant_id = EXCLUDED.merchant_id,
    price = EXCLUDED.price,
    is_promoted = EXCLUDED.is_promoted,
    is_featured = EXCLUDED.is_featured,
    content_hash = EXCLUDED.content_hash,
    updated_at = NOW(),
    -- Keep existing embedding if content hash unchanged
    embedding = CASE
      WHEN entities.content_hash = EXCLUDED.content_hash
      THEN entities.embedding
      ELSE NULL
    END
  WHERE entities.content_hash != EXCLUDED.content_hash
     OR entities.is_promoted != EXCLUDED.is_promoted
     OR entities.is_featured != EXCLUDED.is_featured;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on events table
DROP TRIGGER IF EXISTS trg_event_entity_sync ON events;
CREATE TRIGGER trg_event_entity_sync
  AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION sync_event_to_entities();

-- =============================================================================
-- COUPON SYNC TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_coupon_to_entities()
RETURNS TRIGGER AS $$
DECLARE
  v_content_hash TEXT;
  v_search_text TEXT;
  v_should_exist BOOLEAN;
  v_extra_text TEXT;
BEGIN
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    DELETE FROM entities
    WHERE entity_type = 'coupon' AND source_id = OLD.id;
    RETURN OLD;
  END IF;

  -- Determine if entity should exist (active AND public coupons only)
  v_should_exist := COALESCE(NEW.is_active, FALSE) AND COALESCE(NEW.is_public, FALSE);

  IF NOT v_should_exist THEN
    -- Remove entity if coupon became inactive or private
    DELETE FROM entities
    WHERE entity_type = 'coupon' AND source_id = NEW.id;
    RETURN NEW;
  END IF;

  -- Compute content hash for change detection
  -- Include code for coupons (searchable identifier)
  v_content_hash := md5(
    COALESCE(NEW.title, '') || '|' ||
    COALESCE(NEW.title_ar, '') || '|' ||
    COALESCE(NEW.description, '') || '|' ||
    COALESCE(NEW.code, '')
  );

  -- Build search text (coupon-specific: include code)
  v_extra_text := NEW.code;
  v_search_text := build_entity_search_text(
    'coupon'::entity_type,
    NEW.title,
    NEW.title_ar,
    NEW.description,
    v_extra_text
  );

  -- Upsert entity
  -- Note: Coupons don't have category_id or wilaya_id in the same way
  -- merchant_id may be NULL for platform-wide coupons
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
  ) VALUES (
    'coupon',
    NEW.id,
    NEW.title,
    NEW.title_ar,
    NEW.description,
    v_search_text,
    NULL,  -- Coupons don't have direct category_id
    NULL,  -- Coupons use coupon_rules for wilaya targeting
    NEW.merchant_id,
    NULL,  -- Coupons use discount_value, not price
    COALESCE(NEW.promotion_tier IS NOT NULL, FALSE),
    COALESCE(NEW.is_featured, FALSE),
    v_content_hash,
    COALESCE(NEW.created_at, NOW()),
    NOW()
  )
  ON CONFLICT (entity_type, source_id) DO UPDATE SET
    title = EXCLUDED.title,
    title_ar = EXCLUDED.title_ar,
    description = EXCLUDED.description,
    search_text = EXCLUDED.search_text,
    merchant_id = EXCLUDED.merchant_id,
    is_promoted = EXCLUDED.is_promoted,
    is_featured = EXCLUDED.is_featured,
    content_hash = EXCLUDED.content_hash,
    updated_at = NOW(),
    -- Keep existing embedding if content hash unchanged
    embedding = CASE
      WHEN entities.content_hash = EXCLUDED.content_hash
      THEN entities.embedding
      ELSE NULL
    END
  WHERE entities.content_hash != EXCLUDED.content_hash
     OR entities.is_promoted != EXCLUDED.is_promoted
     OR entities.is_featured != EXCLUDED.is_featured;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on coupons table
DROP TRIGGER IF EXISTS trg_coupon_entity_sync ON coupons;
CREATE TRIGGER trg_coupon_entity_sync
  AFTER INSERT OR UPDATE OR DELETE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION sync_coupon_to_entities();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION sync_product_to_entities() IS 'Syncs active products to entities table for unified search';
COMMENT ON FUNCTION sync_event_to_entities() IS 'Syncs active events to entities table for unified search';
COMMENT ON FUNCTION sync_coupon_to_entities() IS 'Syncs active+public coupons to entities table for unified search';
