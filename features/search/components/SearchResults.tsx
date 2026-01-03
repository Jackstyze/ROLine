'use client'

/**
 * Search Results Component
 * Grid display for hybrid search results
 *
 * FEATURES:
 * - Responsive grid layout
 * - Loading skeleton
 * - Empty state
 * - Timing info display
 * - Pagination support
 */

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2Icon, SearchXIcon, SparklesIcon, ZapIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { hybridSearch } from '../actions/search.actions'
import { SearchResultCard } from './SearchResultCard'
import type { SearchResponse, SearchResult, EntityType } from '../schemas/search.schema'

// =============================================================================
// TYPES
// =============================================================================

type SearchResultsProps = {
  /** Initial search response (from SSR) */
  initialResults?: SearchResponse
  /** Entity types to display */
  entityTypes?: EntityType[]
  /** Show search timing info */
  showTiming?: boolean
  /** Show relevance scores */
  showScores?: boolean
  /** Additional class names */
  className?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SearchResults({
  initialResults,
  entityTypes = ['product', 'event', 'coupon'],
  showTiming = false,
  showScores = false,
  className,
}: SearchResultsProps) {
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [response, setResponse] = useState<SearchResponse | null>(initialResults ?? null)
  const [error, setError] = useState<string | null>(null)

  // Extract search params
  const query = searchParams.get('search') || ''
  const categoryId = searchParams.get('category')
  const wilayaId = searchParams.get('wilaya')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const page = parseInt(searchParams.get('page') || '1', 10)

  // Fetch results when params change
  useEffect(() => {
    // Skip if no search query and no filters
    if (!query && !categoryId && !wilayaId) {
      setResponse(null)
      return
    }

    startTransition(async () => {
      try {
        const result = await hybridSearch({
          query: query || undefined,
          entityTypes,
          categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
          wilayaId: wilayaId ? parseInt(wilayaId, 10) : undefined,
          minPrice: minPrice ? parseFloat(minPrice) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
          page,
          limit: 20,
        })
        setResponse(result)
        setError(null)
      } catch (err) {
        console.error('[SEARCH] Failed:', err)
        setError(err instanceof Error ? err.message : 'Search failed')
        setResponse(null)
      }
    })
  }, [query, categoryId, wilayaId, minPrice, maxPrice, page, entityTypes])

  // Loading state
  if (isPending) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <SearchXIcon className="size-12 text-destructive mb-4" />
          <h3 className="font-medium text-lg">Erreur de recherche</h3>
          <p className="text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    )
  }

  // No query state
  if (!query && !categoryId && !wilayaId) {
    return null // Let parent show default content
  }

  // Empty results
  if (!response || response.results.length === 0) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <SearchXIcon className="size-12 text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg">Aucun résultat</h3>
          <p className="text-muted-foreground mt-1">
            Aucun résultat pour &quot;{query}&quot;
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Essayez des termes différents ou élargissez vos filtres
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {response.total} résultat{response.total !== 1 ? 's' : ''}
            {query && ` pour "${query}"`}
          </span>

          {/* Semantic search indicator */}
          {response.semanticEnabled && (
            <Badge variant="outline" className="text-xs">
              <SparklesIcon className="size-3 me-1" />
              Recherche IA
            </Badge>
          )}
        </div>

        {/* Timing info */}
        {showTiming && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ZapIcon className="size-3" />
            {Math.round(response.timing.totalMs)}ms
            {response.timing.embeddingMs > 0 && (
              <span className="text-muted-foreground/60">
                (embedding: {Math.round(response.timing.embeddingMs)}ms)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {response.results.map((result) => (
          <SearchResultCard
            key={result.id}
            result={result}
            showScore={showScores}
          />
        ))}
      </div>

      {/* Load more */}
      {response.hasMore && (
        <div className="flex justify-center mt-8">
          <Button variant="outline" disabled>
            Page {response.page} sur ...
          </Button>
        </div>
      )}
    </div>
  )
}
