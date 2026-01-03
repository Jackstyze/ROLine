/**
 * Search Cache
 * In-memory cache with TTL for search queries and embeddings
 *
 * ARCHITECTURE:
 * - Simple Map-based cache for server-side
 * - TTL-based expiration
 * - Request deduplication for concurrent calls
 * - Memory-bounded with max entries
 *
 * NOTE: This is per-instance cache. For multi-instance deployments,
 * use Redis or Cloudflare KV instead.
 */

// =============================================================================
// TYPES
// =============================================================================

type CacheEntry<T> = {
  data: T
  expiresAt: number
}

type PendingRequest<T> = Promise<T>

type CacheConfig = {
  /** TTL in milliseconds */
  ttlMs: number
  /** Maximum entries before LRU eviction */
  maxEntries: number
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CONFIG: CacheConfig = {
  ttlMs: 5 * 60 * 1000, // 5 minutes
  maxEntries: 1000,
}

// =============================================================================
// CACHE CLASS
// =============================================================================

class SearchCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private pending = new Map<string, PendingRequest<T>>()
  private accessOrder: string[] = []
  private config: CacheConfig

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Generate cache key from params
   */
  private generateKey(params: Record<string, unknown>): string {
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}:${JSON.stringify(params[k])}`)
      .join('|')
    return sorted
  }

  /**
   * Get cached value if valid
   */
  get(params: Record<string, unknown>): T | null {
    const key = this.generateKey(params)
    const entry = this.cache.get(key)

    if (!entry) return null

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    // Update access order for LRU
    this.updateAccessOrder(key)

    return entry.data
  }

  /**
   * Set cache value
   */
  set(params: Record<string, unknown>, data: T): void {
    const key = this.generateKey(params)

    // Evict if at capacity
    while (this.cache.size >= this.config.maxEntries) {
      const oldest = this.accessOrder.shift()
      if (oldest) {
        this.cache.delete(oldest)
      }
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.config.ttlMs,
    })

    this.updateAccessOrder(key)
  }

  /**
   * Get or fetch with deduplication
   * Prevents multiple concurrent requests for the same params
   */
  async getOrFetch(
    params: Record<string, unknown>,
    fetcher: () => Promise<T>
  ): Promise<T> {
    // Check cache first
    const cached = this.get(params)
    if (cached !== null) {
      return cached
    }

    const key = this.generateKey(params)

    // Check if request is already pending
    const pending = this.pending.get(key)
    if (pending) {
      return pending
    }

    // Create new request
    const request = fetcher()
      .then((data) => {
        this.set(params, data)
        return data
      })
      .finally(() => {
        this.pending.delete(key)
      })

    this.pending.set(key, request)
    return request
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear()
    this.pending.clear()
    this.accessOrder = []
  }

  /**
   * Clear expired entries
   */
  prune(): number {
    const now = Date.now()
    let pruned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        pruned++
      }
    }

    return pruned
  }

  /**
   * Get cache stats
   */
  stats(): { size: number; pending: number; maxEntries: number } {
    return {
      size: this.cache.size,
      pending: this.pending.size,
      maxEntries: this.config.maxEntries,
    }
  }

  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    this.accessOrder.push(key)
  }
}

// =============================================================================
// SINGLETON INSTANCES
// =============================================================================

/** Cache for autocomplete suggestions (short TTL) */
export const autocompleteCache = new SearchCache<unknown[]>({
  ttlMs: 2 * 60 * 1000, // 2 minutes
  maxEntries: 500,
})

/** Cache for search results (medium TTL) */
export const searchResultsCache = new SearchCache<unknown>({
  ttlMs: 5 * 60 * 1000, // 5 minutes
  maxEntries: 200,
})

/** Cache for query embeddings (longer TTL - embeddings don't change) */
export const embeddingCache = new SearchCache<number[]>({
  ttlMs: 30 * 60 * 1000, // 30 minutes
  maxEntries: 1000,
})

// =============================================================================
// EXPORTS
// =============================================================================

export { SearchCache }
export type { CacheConfig }
