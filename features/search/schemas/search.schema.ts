/**
 * Search Schemas
 * Zod validation for search inputs and outputs
 */

import { z } from 'zod'
import { MAX_SEARCH_LENGTH, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/shared/constants/limits'

// =============================================================================
// ENTITY TYPE
// =============================================================================

export const EntityTypeSchema = z.enum(['product', 'event', 'coupon'])
export type EntityType = z.infer<typeof EntityTypeSchema>

// =============================================================================
// SEARCH INPUT SCHEMA
// =============================================================================

export const SearchInputSchema = z.object({
  /** Search query (optional for browse mode) */
  query: z.string().max(MAX_SEARCH_LENGTH).optional(),

  /** Entity types to include */
  entityTypes: z.array(EntityTypeSchema).default(['product', 'event', 'coupon']),

  /** Filter by category */
  categoryId: z.number().int().positive().optional(),

  /** Filter by wilaya (Algerian province) */
  wilayaId: z.number().int().min(1).max(69).optional(),

  /** Price filters */
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().positive().optional(),

  /** Pagination */
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),

  /** RRF weights (for tuning, usually defaults) */
  ftsWeight: z.number().min(0).max(1).default(0.4),
  semanticWeight: z.number().min(0).max(1).default(0.4),
  fuzzyWeight: z.number().min(0).max(1).default(0.2),
})

export type SearchInput = z.infer<typeof SearchInputSchema>

// =============================================================================
// SEARCH RESULT SCHEMA
// =============================================================================

export const SearchResultSchema = z.object({
  id: z.string().uuid(),
  entityType: EntityTypeSchema,
  sourceId: z.string().uuid(),
  title: z.string(),
  titleAr: z.string().nullable(),
  description: z.string().nullable(),
  categoryId: z.number().nullable(),
  wilayaId: z.number().nullable(),
  merchantId: z.string().uuid().nullable(),
  price: z.number().nullable(),
  isPromoted: z.boolean(),
  isFeatured: z.boolean(),
  ftsRank: z.number(),
  semanticScore: z.number(),
  fuzzyScore: z.number(),
  finalScore: z.number(),
})

export type SearchResult = z.infer<typeof SearchResultSchema>

// =============================================================================
// SEARCH RESPONSE SCHEMA
// =============================================================================

export const SearchResponseSchema = z.object({
  results: z.array(SearchResultSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
  timing: z.object({
    embeddingMs: z.number(),
    searchMs: z.number(),
    totalMs: z.number(),
  }),
  /** Indicates if semantic search was used */
  semanticEnabled: z.boolean(),
})

export type SearchResponse = z.infer<typeof SearchResponseSchema>

// =============================================================================
// AUTOCOMPLETE SCHEMA
// =============================================================================

export const AutocompleteInputSchema = z.object({
  query: z.string().min(1).max(MAX_SEARCH_LENGTH),
  entityTypes: z.array(EntityTypeSchema).default(['product', 'event', 'coupon']),
  limit: z.number().int().min(1).max(10).default(5),
})

export type AutocompleteInput = z.infer<typeof AutocompleteInputSchema>

export const AutocompleteResultSchema = z.object({
  title: z.string(),
  entityType: EntityTypeSchema,
})

export type AutocompleteResult = z.infer<typeof AutocompleteResultSchema>
