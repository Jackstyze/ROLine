-- =============================================================================
-- Migration: Unified Entities Table
-- Description: Create searchable entities table for hybrid search
-- Author: CTK AI System
-- Date: 2025-12-30
-- =============================================================================
--
-- PURPOSE:
-- Unified search index for cross-entity discovery (products, events, coupons)
-- Supports: FTS (PGroonga), semantic search (pgvector), fuzzy matching (pg_trgm)
--
-- ARCHITECTURE:
-- - Denormalized for search performance
-- - Synced via triggers from source tables
-- - Embeddings populated async via Cohere API
--
-- DATA FLOW:
-- products/events/coupons -> triggers -> entities -> hybrid_search RPC
-- =============================================================================

-- Entity type enum (matches source tables)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_type') THEN
    CREATE TYPE entity_type AS ENUM ('product', 'event', 'coupon');
  END IF;
END $$;

-- Unified entities table
CREATE TABLE IF NOT EXISTS entities (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source identification
  entity_type entity_type NOT NULL,
  source_id UUID NOT NULL,

  -- Searchable content (denormalized from source)
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,

  -- Concatenated search text for PGroonga indexing
  -- Format varies by entity type (computed in sync trigger)
  search_text TEXT NOT NULL,

  -- Filtering metadata
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  wilaya_id INTEGER REFERENCES wilayas(id) ON DELETE SET NULL,
  merchant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Pricing (NULL for coupons which have discount_value instead)
  price NUMERIC(12, 2),

  -- Vector embedding for semantic search
  -- Dimensions: 1024 (Cohere embed-multilingual-v3.0)
  -- Nullable: populated async, FTS works without embeddings
  embedding extensions.vector(1024),

  -- Change detection hash
  -- MD5 of searchable fields, used to skip unnecessary re-embedding
  content_hash TEXT NOT NULL,

  -- Promotion flags (for ranking boost)
  is_promoted BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one entity per source record
  CONSTRAINT entities_source_unique UNIQUE (entity_type, source_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- B-tree indexes for filtering
CREATE INDEX IF NOT EXISTS idx_entities_type
  ON entities(entity_type);

CREATE INDEX IF NOT EXISTS idx_entities_category
  ON entities(category_id)
  WHERE category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entities_wilaya
  ON entities(wilaya_id)
  WHERE wilaya_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entities_merchant
  ON entities(merchant_id)
  WHERE merchant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entities_promoted
  ON entities(is_promoted, is_featured)
  WHERE is_promoted = TRUE OR is_featured = TRUE;

-- PGroonga index for multilingual full-text search
-- Handles Arabic morphology, French accents, English stemming
CREATE INDEX IF NOT EXISTS idx_entities_search_pgroonga
  ON entities
  USING pgroonga (search_text);

-- Additional PGroonga indexes for title fields
CREATE INDEX IF NOT EXISTS idx_entities_title_pgroonga
  ON entities
  USING pgroonga (title);

CREATE INDEX IF NOT EXISTS idx_entities_title_ar_pgroonga
  ON entities
  USING pgroonga (title_ar)
  WHERE title_ar IS NOT NULL;

-- pg_trgm indexes for fuzzy matching (typo tolerance)
CREATE INDEX IF NOT EXISTS idx_entities_title_trgm
  ON entities
  USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_entities_title_ar_trgm
  ON entities
  USING gin (title_ar gin_trgm_ops)
  WHERE title_ar IS NOT NULL;

-- IVFFlat index for vector similarity search
-- Lists = 100 (optimal for 1K-10K entities, sqrt(n) formula)
-- Uses cosine distance (Cohere embeddings are normalized)
-- Note: Index is created AFTER initial data load for better quality
CREATE INDEX IF NOT EXISTS idx_entities_embedding_ivfflat
  ON entities
  USING ivfflat (embedding extensions.vector_cosine_ops)
  WITH (lists = 100);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read entities (public search)
CREATE POLICY "entities_select_policy"
  ON entities
  FOR SELECT
  TO public
  USING (true);

-- Policy: Only triggers/service role can modify
-- Note: Triggers run as table owner (postgres)
CREATE POLICY "entities_insert_policy"
  ON entities
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "entities_update_policy"
  ON entities
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "entities_delete_policy"
  ON entities
  FOR DELETE
  TO service_role
  USING (true);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to compute content hash for change detection
CREATE OR REPLACE FUNCTION compute_entity_content_hash(
  p_title TEXT,
  p_title_ar TEXT,
  p_description TEXT,
  p_category_id INTEGER
) RETURNS TEXT AS $$
BEGIN
  RETURN md5(
    COALESCE(p_title, '') || '|' ||
    COALESCE(p_title_ar, '') || '|' ||
    COALESCE(p_description, '') || '|' ||
    COALESCE(p_category_id::TEXT, '')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to build search text based on entity type
CREATE OR REPLACE FUNCTION build_entity_search_text(
  p_entity_type entity_type,
  p_title TEXT,
  p_title_ar TEXT,
  p_description TEXT,
  p_extra TEXT DEFAULT NULL
) RETURNS TEXT AS $$
BEGIN
  -- Concatenate with space separation for tokenization
  RETURN TRIM(
    COALESCE(p_title, '') || ' ' ||
    COALESCE(p_title_ar, '') || ' ' ||
    COALESCE(p_description, '') || ' ' ||
    COALESCE(p_extra, '')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE entities IS 'Unified search index for products, events, and coupons';
COMMENT ON COLUMN entities.entity_type IS 'Type of source entity (product, event, coupon)';
COMMENT ON COLUMN entities.source_id IS 'UUID of the source record in products/events/coupons table';
COMMENT ON COLUMN entities.search_text IS 'Concatenated text for PGroonga full-text search';
COMMENT ON COLUMN entities.embedding IS '1024-dim vector from Cohere embed-multilingual-v3.0';
COMMENT ON COLUMN entities.content_hash IS 'MD5 hash for detecting content changes (avoids re-embedding)';
