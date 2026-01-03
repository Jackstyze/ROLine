'use server'

/**
 * Search Server Actions
 * Hybrid search across products, events, and coupons
 *
 * ARCHITECTURE:
 * - Uses Supabase RPC for hybrid_search function
 * - Cohere embeddings for semantic search
 * - Graceful degradation when Cohere unavailable
 *
 * RULES:
 * - ZERO HARDCODE: All config from env/params
 * - ZERO SILENT FAILURES: Errors thrown or logged explicitly
 * - Validation: All inputs via Zod schemas
 */

import { createSupabaseServer } from '@/shared/lib/supabase/server'
import { embedQuery, isCohereConfigured } from '@/shared/lib/cohere'
import {
  SearchInputSchema,
  AutocompleteInputSchema,
  type SearchInput,
  type SearchResponse,
  type SearchResult,
  type AutocompleteInput,
  type AutocompleteResult,
  type EntityType,
} from '../schemas/search.schema'

// =============================================================================
// HYBRID SEARCH
// =============================================================================

/**
 * Hybrid search across entities
 * Combines FTS (PGroonga) + Semantic (pgvector) + Fuzzy (pg_trgm)
 *
 * @param input - Search parameters
 * @returns Search results with timing info
 */
export async function hybridSearch(
  input: Partial<SearchInput>
): Promise<SearchResponse> {
  const startTime = performance.now()

  // Validate and apply defaults
  const parsed = SearchInputSchema.parse(input)
  const supabase = await createSupabaseServer()

  // Track timing
  let embeddingMs = 0
  let queryEmbedding: number[] | null = null
  let semanticEnabled = false

  // Get query embedding if query provided and Cohere configured
  if (parsed.query && parsed.query.trim().length > 0 && isCohereConfigured()) {
    try {
      const embStart = performance.now()
      queryEmbedding = await embedQuery(parsed.query)
      embeddingMs = performance.now() - embStart
      semanticEnabled = true
    } catch (error) {
      // Log but continue with FTS-only search
      console.error('[SEARCH] Cohere embedding failed, falling back to FTS:', error)
      // Do NOT re-throw - graceful degradation
    }
  }

  // Calculate offset
  const offset = (parsed.page - 1) * parsed.limit

  // Call hybrid search RPC
  const searchStart = performance.now()

  const { data, error } = await supabase.rpc('hybrid_search', {
    p_query: parsed.query || '',
    p_query_embedding: queryEmbedding,
    p_entity_types: parsed.entityTypes,
    p_category_id: parsed.categoryId ?? null,
    p_wilaya_id: parsed.wilayaId ?? null,
    p_min_price: parsed.minPrice ?? null,
    p_max_price: parsed.maxPrice ?? null,
    p_limit: parsed.limit + 1, // Fetch one extra to check hasMore
    p_offset: offset,
    p_fts_weight: parsed.ftsWeight,
    p_semantic_weight: semanticEnabled ? parsed.semanticWeight : 0,
    p_fuzzy_weight: parsed.fuzzyWeight,
    p_rrf_k: 60,
  })

  const searchMs = performance.now() - searchStart

  if (error) {
    // Check for specific errors
    if (error.message.includes('pgroonga')) {
      console.error('[SEARCH] PGroonga not available:', error.message)
      throw new Error('Search service temporarily unavailable')
    }
    throw new Error(`Search failed: ${error.message}`)
  }

  // Process results
  const hasMore = (data?.length ?? 0) > parsed.limit
  const results: SearchResult[] = (data ?? [])
    .slice(0, parsed.limit)
    .map((row: Record<string, unknown>) => ({
      id: row.id as string,
      entityType: row.entity_type as EntityType,
      sourceId: row.source_id as string,
      title: row.title as string,
      titleAr: row.title_ar as string | null,
      description: row.description as string | null,
      categoryId: row.category_id as number | null,
      wilayaId: row.wilaya_id as number | null,
      merchantId: row.merchant_id as string | null,
      price: row.price as number | null,
      isPromoted: row.is_promoted as boolean,
      isFeatured: row.is_featured as boolean,
      ftsRank: row.fts_rank as number,
      semanticScore: row.semantic_score as number,
      fuzzyScore: row.fuzzy_score as number,
      finalScore: row.final_score as number,
    }))

  return {
    results,
    total: results.length, // Approximate; full count requires separate query
    page: parsed.page,
    limit: parsed.limit,
    hasMore,
    timing: {
      embeddingMs,
      searchMs,
      totalMs: performance.now() - startTime,
    },
    semanticEnabled,
  }
}

// =============================================================================
// AUTOCOMPLETE
// =============================================================================

/**
 * Fast autocomplete for search input
 * Uses prefix matching on titles
 *
 * @param input - Autocomplete parameters
 * @returns Suggested titles
 */
export async function autocomplete(
  input: Partial<AutocompleteInput>
): Promise<AutocompleteResult[]> {
  // Validate
  const parsed = AutocompleteInputSchema.parse(input)

  if (parsed.query.length < 2) {
    return []
  }

  const supabase = await createSupabaseServer()

  const { data, error } = await supabase.rpc('autocomplete_search', {
    p_query: parsed.query,
    p_entity_types: parsed.entityTypes,
    p_limit: parsed.limit,
  })

  if (error) {
    console.error('[AUTOCOMPLETE] Failed:', error.message)
    return []
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    title: row.title as string,
    entityType: row.entity_type as EntityType,
  }))
}

// =============================================================================
// ENTITY-SPECIFIC SEARCH
// =============================================================================

/**
 * Search only products
 */
export async function searchProducts(
  input: Omit<Partial<SearchInput>, 'entityTypes'>
): Promise<SearchResponse> {
  return hybridSearch({
    ...input,
    entityTypes: ['product'],
  })
}

/**
 * Search only events
 */
export async function searchEvents(
  input: Omit<Partial<SearchInput>, 'entityTypes'>
): Promise<SearchResponse> {
  return hybridSearch({
    ...input,
    entityTypes: ['event'],
  })
}

/**
 * Search only coupons
 */
export async function searchCoupons(
  input: Omit<Partial<SearchInput>, 'entityTypes'>
): Promise<SearchResponse> {
  return hybridSearch({
    ...input,
    entityTypes: ['coupon'],
  })
}

// =============================================================================
// SEMANTIC SIMILARITY (for "similar items")
// =============================================================================

/**
 * Find similar entities based on embedding similarity
 *
 * @param sourceId - ID of the source entity
 * @param entityType - Type of entity
 * @param limit - Number of results
 * @returns Similar entities
 */
export async function findSimilar(
  sourceId: string,
  entityType: EntityType,
  limit: number = 6
): Promise<SearchResult[]> {
  const supabase = await createSupabaseServer()

  // Get the source entity's embedding
  const { data: sourceData, error: sourceError } = await supabase
    .from('entities')
    .select('embedding')
    .eq('source_id', sourceId)
    .eq('entity_type', entityType)
    .single()

  if (sourceError || !sourceData?.embedding) {
    console.error('[SIMILAR] Source entity not found or no embedding')
    return []
  }

  // Search for similar using the source embedding
  const { data, error } = await supabase.rpc('hybrid_search', {
    p_query: '',
    p_query_embedding: sourceData.embedding,
    p_entity_types: [entityType],
    p_category_id: null,
    p_wilaya_id: null,
    p_min_price: null,
    p_max_price: null,
    p_limit: limit + 1, // Extra to exclude self
    p_offset: 0,
    p_fts_weight: 0,
    p_semantic_weight: 1,
    p_fuzzy_weight: 0,
    p_rrf_k: 60,
  })

  if (error) {
    console.error('[SIMILAR] Search failed:', error.message)
    return []
  }

  // Filter out the source entity
  return (data ?? [])
    .filter((row: Record<string, unknown>) => row.source_id !== sourceId)
    .slice(0, limit)
    .map((row: Record<string, unknown>) => ({
      id: row.id as string,
      entityType: row.entity_type as EntityType,
      sourceId: row.source_id as string,
      title: row.title as string,
      titleAr: row.title_ar as string | null,
      description: row.description as string | null,
      categoryId: row.category_id as number | null,
      wilayaId: row.wilaya_id as number | null,
      merchantId: row.merchant_id as string | null,
      price: row.price as number | null,
      isPromoted: row.is_promoted as boolean,
      isFeatured: row.is_featured as boolean,
      ftsRank: 0,
      semanticScore: row.semantic_score as number,
      fuzzyScore: 0,
      finalScore: row.final_score as number,
    }))
}
