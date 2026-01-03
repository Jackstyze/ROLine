/**
 * Search Feature Module
 * Cross-entity hybrid search with semantic embeddings
 */

// Actions
export {
  hybridSearch,
  autocomplete,
  searchProducts,
  searchEvents,
  searchCoupons,
  findSimilar,
} from './actions/search.actions'

// Types
export type {
  SearchInput,
  SearchResponse,
  SearchResult,
  AutocompleteInput,
  AutocompleteResult,
  EntityType,
} from './schemas/search.schema'

// Components
export {
  UnifiedSearch,
  SearchResultCard,
  SearchResults,
  SearchErrorBoundary,
  withSearchErrorBoundary,
  SearchSkeleton,
} from './components'

// Hooks
export { useDebounce, useAutocomplete } from './hooks'

// Analytics
export {
  trackSearch,
  trackSearchClick,
  trackNoResults,
  trackAutocompleteSelect,
  getSearchAnalytics,
} from './lib/analytics'

// Cache
export {
  autocompleteCache,
  searchResultsCache,
  embeddingCache,
  SearchCache,
} from './lib/cache'

// Services (server-side only)
export {
  syncPendingEmbeddings,
  getPendingEmbeddingCount,
  rebuildEmbeddings,
  getSyncStatus,
} from './services/embedding-sync.service'
