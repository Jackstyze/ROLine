/**
 * Search Loading Skeleton
 * Placeholder UI while search results are loading
 *
 * DESIGN:
 * - Matches SearchResultCard layout
 * - Animated pulse effect
 * - Responsive grid
 */

import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/components/ui/skeleton'

// =============================================================================
// TYPES
// =============================================================================

type SearchSkeletonProps = {
  /** Number of skeleton cards to show */
  count?: number
  /** Grid columns */
  columns?: 2 | 3 | 4
  /** Additional class names */
  className?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SearchSkeleton({
  count = 8,
  columns = 4,
  className,
}: SearchSkeletonProps) {
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Grid skeleton */}
      <div className={cn('grid gap-4', gridClasses[columns])}>
        {Array.from({ length: count }).map((_, i) => (
          <SearchResultCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// CARD SKELETON
// =============================================================================

function SearchResultCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Image skeleton */}
      <div className="relative aspect-square bg-gray-100">
        <Skeleton className="absolute inset-0" />
        {/* Entity type badge skeleton */}
        <Skeleton className="absolute top-2 start-2 h-6 w-16 rounded" />
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Category */}
        <Skeleton className="h-3 w-20" />

        {/* Title */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Location */}
        <Skeleton className="h-3 w-24" />

        {/* Price */}
        <Skeleton className="h-6 w-28" />
      </div>
    </div>
  )
}

// =============================================================================
// AUTOCOMPLETE SKELETON
// =============================================================================

export function AutocompleteSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="p-2 space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5">
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  )
}
