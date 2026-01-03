-- =============================================================================
-- Migration: Hybrid Search RPC Function
-- Description: Cross-entity search combining FTS, semantic, and fuzzy matching
-- Author: CTK AI System
-- Date: 2025-12-30
-- =============================================================================
--
-- SEARCH ALGORITHM: Reciprocal Rank Fusion (RRF)
-- Combines three retrieval methods:
-- 1. FTS (PGroonga): Keyword matching with Arabic/French/English support
-- 2. Semantic (pgvector): Embedding similarity via Cohere embed-v3
-- 3. Fuzzy (pg_trgm): Typo-tolerant matching via trigram similarity
--
-- FORMULA: score = w_fts/(k+rank_fts) + w_sem/(k+rank_sem) + w_fuz/(k+rank_fuz)
-- Where k = 60 (standard RRF constant)
--
-- FALLBACK BEHAVIOR:
-- - When p_query_embedding is NULL: Skip semantic search (FTS + Fuzzy only)
-- - When p_query is empty: Return promoted/featured items
-- =============================================================================

-- Drop existing function if exists (for idempotent migration)
DROP FUNCTION IF EXISTS hybrid_search(
  TEXT,
  extensions.vector(1024),
  entity_type[],
  INTEGER,
  INTEGER,
  NUMERIC,
  NUMERIC,
  INTEGER,
  INTEGER,
  FLOAT,
  FLOAT,
  FLOAT,
  INTEGER
);

-- Create hybrid search function
CREATE OR REPLACE FUNCTION hybrid_search(
  p_query TEXT DEFAULT '',
  p_query_embedding extensions.vector(1024) DEFAULT NULL,
  p_entity_types entity_type[] DEFAULT ARRAY['product', 'event', 'coupon']::entity_type[],
  p_category_id INTEGER DEFAULT NULL,
  p_wilaya_id INTEGER DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_fts_weight FLOAT DEFAULT 0.4,
  p_semantic_weight FLOAT DEFAULT 0.4,
  p_fuzzy_weight FLOAT DEFAULT 0.2,
  p_rrf_k INTEGER DEFAULT 60
)
RETURNS TABLE (
  id UUID,
  entity_type entity_type,
  source_id UUID,
  title TEXT,
  title_ar TEXT,
  description TEXT,
  category_id INTEGER,
  wilaya_id INTEGER,
  merchant_id UUID,
  price NUMERIC,
  is_promoted BOOLEAN,
  is_featured BOOLEAN,
  fts_rank FLOAT,
  semantic_score FLOAT,
  fuzzy_score FLOAT,
  final_score FLOAT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_has_query BOOLEAN;
  v_has_embedding BOOLEAN;
  v_search_limit INTEGER;
BEGIN
  -- Determine search mode
  v_has_query := p_query IS NOT NULL AND TRIM(p_query) != '';
  v_has_embedding := p_query_embedding IS NOT NULL;

  -- Search limit for each retrieval method (fetch more for RRF combination)
  v_search_limit := p_limit * 3;

  -- If no query and no embedding, return promoted/featured items
  IF NOT v_has_query AND NOT v_has_embedding THEN
    RETURN QUERY
    SELECT
      e.id,
      e.entity_type,
      e.source_id,
      e.title,
      e.title_ar,
      e.description,
      e.category_id,
      e.wilaya_id,
      e.merchant_id,
      e.price,
      e.is_promoted,
      e.is_featured,
      0.0::FLOAT AS fts_rank,
      0.0::FLOAT AS semantic_score,
      0.0::FLOAT AS fuzzy_score,
      (CASE WHEN e.is_promoted THEN 1.0 ELSE 0.0 END +
       CASE WHEN e.is_featured THEN 0.5 ELSE 0.0 END)::FLOAT AS final_score
    FROM entities e
    WHERE e.entity_type = ANY(p_entity_types)
      AND (p_category_id IS NULL OR e.category_id = p_category_id)
      AND (p_wilaya_id IS NULL OR e.wilaya_id = p_wilaya_id)
      AND (p_min_price IS NULL OR e.price >= p_min_price)
      AND (p_max_price IS NULL OR e.price <= p_max_price)
    ORDER BY e.is_promoted DESC, e.is_featured DESC, e.updated_at DESC
    LIMIT p_limit
    OFFSET p_offset;
    RETURN;
  END IF;

  -- Perform hybrid search with RRF
  RETURN QUERY
  WITH
  -- Base filter: Apply entity type and metadata filters
  base_entities AS (
    SELECT e.*
    FROM entities e
    WHERE e.entity_type = ANY(p_entity_types)
      AND (p_category_id IS NULL OR e.category_id = p_category_id)
      AND (p_wilaya_id IS NULL OR e.wilaya_id = p_wilaya_id)
      AND (p_min_price IS NULL OR e.price >= p_min_price)
      AND (p_max_price IS NULL OR e.price <= p_max_price)
  ),

  -- FTS results using PGroonga
  fts_results AS (
    SELECT
      e.id,
      pgroonga_score(tableoid, ctid) AS score,
      ROW_NUMBER() OVER (ORDER BY pgroonga_score(tableoid, ctid) DESC) AS rn
    FROM base_entities e
    WHERE v_has_query
      AND e.search_text &@~ p_query  -- PGroonga full-text match
    ORDER BY pgroonga_score(tableoid, ctid) DESC
    LIMIT v_search_limit
  ),

  -- Semantic results using pgvector (only if embedding provided)
  semantic_results AS (
    SELECT
      e.id,
      1 - (e.embedding <=> p_query_embedding) AS score,  -- Cosine similarity
      ROW_NUMBER() OVER (ORDER BY e.embedding <=> p_query_embedding) AS rn
    FROM base_entities e
    WHERE v_has_embedding
      AND e.embedding IS NOT NULL
    ORDER BY e.embedding <=> p_query_embedding
    LIMIT v_search_limit
  ),

  -- Fuzzy results using pg_trgm
  fuzzy_results AS (
    SELECT
      e.id,
      GREATEST(
        similarity(e.title, p_query),
        COALESCE(similarity(e.title_ar, p_query), 0)
      ) AS score,
      ROW_NUMBER() OVER (
        ORDER BY GREATEST(
          similarity(e.title, p_query),
          COALESCE(similarity(e.title_ar, p_query), 0)
        ) DESC
      ) AS rn
    FROM base_entities e
    WHERE v_has_query
      AND (
        e.title % p_query
        OR (e.title_ar IS NOT NULL AND e.title_ar % p_query)
      )
    ORDER BY GREATEST(
      similarity(e.title, p_query),
      COALESCE(similarity(e.title_ar, p_query), 0)
    ) DESC
    LIMIT v_search_limit
  ),

  -- Reciprocal Rank Fusion
  rrf_combined AS (
    SELECT
      COALESCE(f.id, s.id, z.id) AS id,
      -- RRF scores with weights
      COALESCE(p_fts_weight / (p_rrf_k + f.rn), 0) AS fts_rrf,
      COALESCE(p_semantic_weight / (p_rrf_k + s.rn), 0) AS sem_rrf,
      COALESCE(p_fuzzy_weight / (p_rrf_k + z.rn), 0) AS fuz_rrf,
      -- Raw scores for debugging
      COALESCE(f.score, 0) AS fts_raw,
      COALESCE(s.score, 0) AS sem_raw,
      COALESCE(z.score, 0) AS fuz_raw
    FROM fts_results f
    FULL OUTER JOIN semantic_results s ON f.id = s.id
    FULL OUTER JOIN fuzzy_results z ON COALESCE(f.id, s.id) = z.id
  ),

  -- Ranked results
  ranked AS (
    SELECT
      r.id,
      r.fts_raw::FLOAT AS fts_rank,
      r.sem_raw::FLOAT AS semantic_score,
      r.fuz_raw::FLOAT AS fuzzy_score,
      (r.fts_rrf + r.sem_rrf + r.fuz_rrf)::FLOAT AS final_score
    FROM rrf_combined r
    ORDER BY (r.fts_rrf + r.sem_rrf + r.fuz_rrf) DESC
  )

  -- Final output with entity details
  SELECT
    e.id,
    e.entity_type,
    e.source_id,
    e.title,
    e.title_ar,
    e.description,
    e.category_id,
    e.wilaya_id,
    e.merchant_id,
    e.price,
    e.is_promoted,
    e.is_featured,
    r.fts_rank,
    r.semantic_score,
    r.fuzzy_score,
    -- Boost promoted/featured items
    (r.final_score +
     CASE WHEN e.is_promoted THEN 0.1 ELSE 0 END +
     CASE WHEN e.is_featured THEN 0.05 ELSE 0 END)::FLOAT AS final_score
  FROM ranked r
  JOIN entities e ON e.id = r.id
  ORDER BY final_score DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- =============================================================================
-- AUTOCOMPLETE FUNCTION (Lightweight)
-- =============================================================================

CREATE OR REPLACE FUNCTION autocomplete_search(
  p_query TEXT,
  p_entity_types entity_type[] DEFAULT ARRAY['product', 'event', 'coupon']::entity_type[],
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  title TEXT,
  entity_type entity_type
)
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT ON (e.title)
    e.title,
    e.entity_type
  FROM entities e
  WHERE e.entity_type = ANY(p_entity_types)
    AND (
      e.title ILIKE p_query || '%'
      OR e.title_ar ILIKE p_query || '%'
    )
  ORDER BY e.title, e.is_promoted DESC, e.is_featured DESC
  LIMIT p_limit;
$$;

-- =============================================================================
-- EMBEDDING UPDATE FUNCTION
-- =============================================================================

-- Function to update entity embeddings (called from background worker)
CREATE OR REPLACE FUNCTION update_entity_embedding(
  p_entity_id UUID,
  p_embedding extensions.vector(1024)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE entities
  SET
    embedding = p_embedding,
    updated_at = NOW()
  WHERE id = p_entity_id;
END;
$$;

-- Function to get entities needing embeddings
CREATE OR REPLACE FUNCTION get_entities_pending_embedding(
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  entity_type entity_type,
  search_text TEXT,
  content_hash TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    e.id,
    e.entity_type,
    e.search_text,
    e.content_hash
  FROM entities e
  WHERE e.embedding IS NULL
  ORDER BY e.created_at DESC
  LIMIT p_limit;
$$;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION hybrid_search IS 'Cross-entity search with FTS + semantic + fuzzy using RRF';
COMMENT ON FUNCTION autocomplete_search IS 'Fast prefix-based autocomplete for search input';
COMMENT ON FUNCTION update_entity_embedding IS 'Update embedding for entity (called by background worker)';
COMMENT ON FUNCTION get_entities_pending_embedding IS 'Get entities without embeddings for async processing';

-- =============================================================================
-- GRANTS
-- =============================================================================

-- Allow authenticated users to search
GRANT EXECUTE ON FUNCTION hybrid_search TO authenticated;
GRANT EXECUTE ON FUNCTION autocomplete_search TO authenticated;

-- Allow anonymous users to search (public marketplace)
GRANT EXECUTE ON FUNCTION hybrid_search TO anon;
GRANT EXECUTE ON FUNCTION autocomplete_search TO anon;

-- Only service role can update embeddings
GRANT EXECUTE ON FUNCTION update_entity_embedding TO service_role;
GRANT EXECUTE ON FUNCTION get_entities_pending_embedding TO service_role;
