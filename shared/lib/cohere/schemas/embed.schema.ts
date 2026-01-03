/**
 * Cohere Embed API Schemas
 * API v1: https://docs.cohere.com/reference/embed
 *
 * Zod validation for request/response types
 */

import { z } from 'zod'

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Input type determines how the text is processed
 * - search_document: For texts being indexed (entities)
 * - search_query: For user search queries
 */
export const EmbedInputTypeSchema = z.enum([
  'search_document',
  'search_query',
  'classification',
  'clustering',
])

export type EmbedInputType = z.infer<typeof EmbedInputTypeSchema>

// =============================================================================
// REQUEST SCHEMAS
// =============================================================================

/**
 * Embed request schema
 * Max 96 texts per request, each max 512 tokens
 */
export const EmbedRequestSchema = z.object({
  texts: z.array(z.string()).min(1).max(96),
  model: z.string().default('embed-multilingual-v3.0'),
  input_type: EmbedInputTypeSchema,
  truncate: z.enum(['NONE', 'START', 'END']).default('END'),
})

export type EmbedRequest = z.infer<typeof EmbedRequestSchema>

/**
 * Simplified embed request for common use cases
 */
export const SimpleEmbedRequestSchema = z.object({
  texts: z.array(z.string()).min(1).max(96),
  input_type: EmbedInputTypeSchema,
})

export type SimpleEmbedRequest = z.infer<typeof SimpleEmbedRequestSchema>

// =============================================================================
// RESPONSE SCHEMAS
// =============================================================================

/**
 * Single embedding response
 * Dimensions: 1024 for embed-multilingual-v3.0
 */
export const EmbeddingSchema = z.array(z.number())

/**
 * Cohere API meta information
 */
export const ApiMetaSchema = z.object({
  api_version: z.object({
    version: z.string(),
  }).optional(),
  billed_units: z.object({
    input_tokens: z.number().optional(),
    output_tokens: z.number().optional(),
  }).optional(),
})

/**
 * Full embed response schema
 */
export const EmbedResponseSchema = z.object({
  id: z.string(),
  embeddings: z.array(EmbeddingSchema),
  texts: z.array(z.string()),
  meta: ApiMetaSchema.optional(),
})

export type EmbedResponse = z.infer<typeof EmbedResponseSchema>

// =============================================================================
// ERROR SCHEMAS
// =============================================================================

export const CohereErrorSchema = z.object({
  message: z.string(),
  status_code: z.number().optional(),
})

export type CohereError = z.infer<typeof CohereErrorSchema>

// =============================================================================
// CONSTANTS
// =============================================================================

export const COHERE_CONSTANTS = {
  /** Maximum texts per embed request */
  MAX_TEXTS_PER_REQUEST: 96,
  /** Model for multilingual embeddings */
  MODEL: 'embed-multilingual-v3.0',
  /** Embedding dimensions for this model */
  DIMENSIONS: 1024,
  /** API base URL */
  BASE_URL: 'https://api.cohere.ai/v1',
} as const
