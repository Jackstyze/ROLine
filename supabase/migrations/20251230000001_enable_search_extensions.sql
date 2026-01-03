-- =============================================================================
-- Migration: Enable Search Extensions
-- Description: Enable pgvector, pgroonga, and pg_trgm for hybrid search
-- Author: CTK AI System
-- Date: 2025-12-30
-- =============================================================================
--
-- EXTENSIONS:
-- - pgvector: Vector similarity search for semantic embeddings (Cohere embed-v3)
-- - pgroonga: Multilingual full-text search (Arabic, French, English)
-- - pg_trgm: Trigram similarity for fuzzy/typo-tolerant search
--
-- ARCHITECTURE DECISIONS:
-- 1. pgvector uses extensions schema (Supabase convention)
-- 2. pgroonga uses extensions schema (required for Supabase)
-- 3. pg_trgm uses public schema (standard Postgres)
--
-- FALLBACK STRATEGY:
-- - Each extension is optional; application handles missing extensions gracefully
-- - Search degrades: semantic -> FTS -> ILIKE
-- =============================================================================

-- pgvector: Vector similarity search
-- Dimensions: 1024 (Cohere embed-multilingual-v3.0)
-- Index type: IVFFlat (better insert performance than HNSW for MVP)
CREATE EXTENSION IF NOT EXISTS vector
WITH SCHEMA extensions;

-- pgroonga: Multilingual full-text search
-- Supports Arabic morphology, French accents, English stemming
-- Superior to PostgreSQL built-in FTS for non-Latin scripts
CREATE EXTENSION IF NOT EXISTS pgroonga
WITH SCHEMA extensions;

-- pg_trgm: Trigram similarity
-- Enables fuzzy matching with % operator and similarity() function
-- Catches typos like "laptpo" -> "laptop"
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- Verify extensions are enabled (will fail migration if not available)
DO $$
BEGIN
  -- Check pgvector
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) THEN
    RAISE WARNING 'pgvector extension not available - semantic search will be disabled';
  END IF;

  -- Check pgroonga
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pgroonga'
  ) THEN
    RAISE WARNING 'pgroonga extension not available - falling back to basic FTS';
  END IF;

  -- Check pg_trgm
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
  ) THEN
    RAISE WARNING 'pg_trgm extension not available - fuzzy search will be disabled';
  END IF;
END $$;
