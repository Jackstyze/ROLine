/**
 * Embedding Sync Service
 * Background processing for entity embeddings
 *
 * ARCHITECTURE:
 * - Fetches entities without embeddings
 * - Generates embeddings via Cohere API
 * - Updates entities in batches
 * - Designed for server-side execution (cron, API route)
 *
 * USAGE:
 * - Call from API route: /api/cron/sync-embeddings
 * - Or from server action for manual trigger
 */

import { createSupabaseAdmin } from '@/shared/lib/supabase/server'
import { embedDocuments, isCohereConfigured, COHERE_CONSTANTS } from '@/shared/lib/cohere'

// =============================================================================
// TYPES
// =============================================================================

type PendingEntity = {
  id: string
  entity_type: 'product' | 'event' | 'coupon'
  search_text: string
  content_hash: string
}

type SyncResult = {
  processed: number
  success: number
  failed: number
  errors: string[]
  durationMs: number
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const SYNC_CONFIG = {
  /** Batch size for fetching entities */
  FETCH_BATCH_SIZE: 50,
  /** Batch size for embedding requests (Cohere limit is 96) */
  EMBED_BATCH_SIZE: 50,
  /** Max retries per entity */
  MAX_RETRIES: 2,
  /** Delay between batches (ms) to avoid rate limits */
  BATCH_DELAY_MS: 100,
} as const

// =============================================================================
// SYNC FUNCTIONS
// =============================================================================

/**
 * Sync embeddings for pending entities
 * Fetches entities without embeddings and generates them
 *
 * @param limit - Max entities to process (default 50)
 * @returns Sync result with stats
 */
export async function syncPendingEmbeddings(
  limit: number = SYNC_CONFIG.FETCH_BATCH_SIZE
): Promise<SyncResult> {
  const startTime = performance.now()
  const result: SyncResult = {
    processed: 0,
    success: 0,
    failed: 0,
    errors: [],
    durationMs: 0,
  }

  // Check Cohere availability
  if (!isCohereConfigured()) {
    result.errors.push('Cohere API not configured - skipping embedding sync')
    result.durationMs = performance.now() - startTime
    return result
  }

  // Use admin client to bypass RLS
  const supabase = createSupabaseAdmin()

  // Fetch pending entities
  const { data: pending, error: fetchError } = await supabase
    .rpc('get_entities_pending_embedding', {
      p_limit: limit,
    })

  if (fetchError) {
    result.errors.push(`Failed to fetch pending entities: ${fetchError.message}`)
    result.durationMs = performance.now() - startTime
    return result
  }

  if (!pending || pending.length === 0) {
    result.durationMs = performance.now() - startTime
    return result
  }

  result.processed = pending.length

  // Process in batches
  for (let i = 0; i < pending.length; i += SYNC_CONFIG.EMBED_BATCH_SIZE) {
    const batch = pending.slice(i, i + SYNC_CONFIG.EMBED_BATCH_SIZE) as PendingEntity[]

    try {
      // Generate embeddings
      const texts = batch.map((e) => e.search_text)
      const embeddings = await embedDocuments(texts)

      // Update each entity
      for (let j = 0; j < batch.length; j++) {
        const entity = batch[j]
        const embedding = embeddings[j]

        const { error: updateError } = await supabase
          .rpc('update_entity_embedding', {
            p_entity_id: entity.id,
            p_embedding: embedding,
          })

        if (updateError) {
          result.failed++
          result.errors.push(
            `Failed to update ${entity.entity_type} ${entity.id}: ${updateError.message}`
          )
        } else {
          result.success++
        }
      }

      // Delay between batches to respect rate limits
      if (i + SYNC_CONFIG.EMBED_BATCH_SIZE < pending.length) {
        await sleep(SYNC_CONFIG.BATCH_DELAY_MS)
      }
    } catch (error) {
      // Batch failed
      result.failed += batch.length
      result.errors.push(
        `Batch embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  result.durationMs = performance.now() - startTime
  return result
}

/**
 * Get count of entities pending embeddings
 */
export async function getPendingEmbeddingCount(): Promise<number> {
  const supabase = createSupabaseAdmin()

  const { count, error } = await supabase
    .from('entities')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null)

  if (error) {
    console.error('[SYNC] Failed to count pending:', error.message)
    return 0
  }

  return count ?? 0
}

/**
 * Rebuild embeddings for specific entity type
 * Clears existing embeddings and regenerates
 *
 * @param entityType - Type of entity to rebuild
 */
export async function rebuildEmbeddings(
  entityType: 'product' | 'event' | 'coupon'
): Promise<SyncResult> {
  const supabase = createSupabaseAdmin()

  // Clear existing embeddings
  const { error: clearError } = await supabase
    .from('entities')
    .update({ embedding: null })
    .eq('entity_type', entityType)

  if (clearError) {
    return {
      processed: 0,
      success: 0,
      failed: 0,
      errors: [`Failed to clear embeddings: ${clearError.message}`],
      durationMs: 0,
    }
  }

  // Sync all pending (which now includes all of this type)
  return syncPendingEmbeddings(1000)
}

/**
 * Get sync status for monitoring
 */
export async function getSyncStatus(): Promise<{
  total: number
  withEmbedding: number
  pending: number
  coverage: number
}> {
  const supabase = createSupabaseAdmin()

  const [totalResult, withEmbeddingResult] = await Promise.all([
    supabase.from('entities').select('id', { count: 'exact', head: true }),
    supabase
      .from('entities')
      .select('id', { count: 'exact', head: true })
      .not('embedding', 'is', null),
  ])

  const total = totalResult.count ?? 0
  const withEmbedding = withEmbeddingResult.count ?? 0
  const pending = total - withEmbedding
  const coverage = total > 0 ? (withEmbedding / total) * 100 : 0

  return {
    total,
    withEmbedding,
    pending,
    coverage: Math.round(coverage * 100) / 100,
  }
}

// =============================================================================
// UTILITIES
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// =============================================================================
// EXPORTS
// =============================================================================

export { SYNC_CONFIG }
