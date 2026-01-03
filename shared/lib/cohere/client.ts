/**
 * Cohere Embeddings Client
 * API v1 - Factory pattern (following Chargily provider pattern)
 *
 * Docs: https://docs.cohere.com/reference/embed
 *
 * ARCHITECTURE:
 * - Lazy config loading (env vars accessed only when needed)
 * - Zod validation for all inputs/outputs
 * - Explicit error throwing (ZERO silent failures)
 * - Batching support for large text sets
 * - Query embedding caching (30min TTL)
 */

import {
  EmbedRequestSchema,
  EmbedResponseSchema,
  COHERE_CONSTANTS,
  type EmbedInputType,
  type EmbedResponse,
} from './schemas/embed.schema'

// =============================================================================
// QUERY EMBEDDING CACHE
// =============================================================================

type CacheEntry = {
  embedding: number[]
  expiresAt: number
}

const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes
const queryCache = new Map<string, CacheEntry>()

function getCachedEmbedding(query: string): number[] | null {
  const entry = queryCache.get(query)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    queryCache.delete(query)
    return null
  }
  return entry.embedding
}

function setCachedEmbedding(query: string, embedding: number[]): void {
  // Limit cache size
  if (queryCache.size >= 1000) {
    const firstKey = queryCache.keys().next().value
    if (firstKey) queryCache.delete(firstKey)
  }
  queryCache.set(query, {
    embedding,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })
}

// =============================================================================
// CONFIG
// =============================================================================

type CohereConfig = {
  apiKey: string
  baseUrl: string
}

/**
 * Lazy config loader
 * Throws if API key not configured
 */
function getConfig(): CohereConfig {
  const apiKey = process.env.COHERE_API_KEY

  if (!apiKey) {
    throw new Error(
      'COHERE_API_KEY not configured. Set it in .env.local for semantic search.'
    )
  }

  return {
    apiKey,
    baseUrl: COHERE_CONSTANTS.BASE_URL,
  }
}

/**
 * Check if Cohere is configured (for graceful degradation)
 */
export function isCohereConfigured(): boolean {
  return !!process.env.COHERE_API_KEY
}

// =============================================================================
// EMBED FUNCTIONS
// =============================================================================

/**
 * Generate embeddings for texts
 * Uses embed-multilingual-v3.0 model (1024 dimensions)
 *
 * @param texts - Array of texts to embed (max 96)
 * @param inputType - 'search_document' for indexing, 'search_query' for queries
 * @returns Array of embeddings (1024-dimensional vectors)
 */
export async function embedTexts(
  texts: string[],
  inputType: EmbedInputType
): Promise<number[][]> {
  if (texts.length === 0) {
    return []
  }

  const config = getConfig()

  // Validate input
  const request = EmbedRequestSchema.parse({
    texts,
    model: COHERE_CONSTANTS.MODEL,
    input_type: inputType,
    truncate: 'END',
  })

  const response = await fetch(`${config.baseUrl}/embed`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'X-Client-Name': 'roline-marketplace',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `Cohere API error (${response.status}): ${errorBody}`
    )
  }

  const data = await response.json()
  const validated = EmbedResponseSchema.parse(data)

  return validated.embeddings
}

/**
 * Embed a single query for search
 * Uses 'search_query' input type for optimal retrieval
 * Results are cached for 30 minutes
 *
 * @param query - User search query
 * @returns 1024-dimensional embedding vector
 */
export async function embedQuery(query: string): Promise<number[]> {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    throw new Error('Query cannot be empty')
  }

  // Check cache first
  const cached = getCachedEmbedding(trimmedQuery)
  if (cached) {
    return cached
  }

  // Fetch from API
  const embeddings = await embedTexts([trimmedQuery], 'search_query')
  const embedding = embeddings[0]

  // Cache result
  setCachedEmbedding(trimmedQuery, embedding)

  return embedding
}

/**
 * Embed texts for document indexing
 * Uses 'search_document' input type
 *
 * @param texts - Texts to index
 * @returns Array of embeddings
 */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  return embedTexts(texts, 'search_document')
}

/**
 * Batch embed large text sets
 * Splits into chunks of 96 texts (Cohere limit)
 *
 * @param texts - Array of texts (any size)
 * @param inputType - Embedding input type
 * @returns All embeddings in order
 */
export async function embedBatch(
  texts: string[],
  inputType: EmbedInputType
): Promise<number[][]> {
  if (texts.length === 0) {
    return []
  }

  const results: number[][] = []
  const batchSize = COHERE_CONSTANTS.MAX_TEXTS_PER_REQUEST

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const embeddings = await embedTexts(batch, inputType)
    results.push(...embeddings)
  }

  return results
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate cosine similarity between two embeddings
 * Useful for client-side re-ranking
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimension')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// =============================================================================
// EXPORTS
// =============================================================================

export { COHERE_CONSTANTS } from './schemas/embed.schema'
export type { EmbedInputType, EmbedResponse } from './schemas/embed.schema'
