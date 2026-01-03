'use client'

/**
 * Search Result Card Component
 * Unified card for products, events, and coupons
 *
 * DESIGN:
 * - Follows ProductCard pattern
 * - Entity type badge for visual distinction
 * - Relevance score indicator (optional)
 * - RTL support
 */

import Link from 'next/link'
import Image from 'next/image'
import { PackageIcon, CalendarIcon, TicketIcon, MapPinIcon, SparklesIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/components/ui/badge'
import type { SearchResult, EntityType } from '../schemas/search.schema'

// =============================================================================
// TYPES
// =============================================================================

type SearchResultCardProps = {
  result: SearchResult
  /** Show relevance score */
  showScore?: boolean
  /** Highlight matching text */
  highlightQuery?: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ENTITY_CONFIG: Record<
  EntityType,
  {
    icon: typeof PackageIcon
    label: string
    labelAr: string
    path: string
    color: string
  }
> = {
  product: {
    icon: PackageIcon,
    label: 'Produit',
    labelAr: 'منتج',
    path: '/marketplace',
    color: 'bg-blue-500',
  },
  event: {
    icon: CalendarIcon,
    label: 'Événement',
    labelAr: 'حدث',
    path: '/events',
    color: 'bg-purple-500',
  },
  coupon: {
    icon: TicketIcon,
    label: 'Offre',
    labelAr: 'عرض',
    path: '/offers',
    color: 'bg-orange-500',
  },
}

// =============================================================================
// HELPERS
// =============================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

function getRelevanceLabel(score: number): { label: string; color: string } {
  if (score >= 0.8) return { label: 'Très pertinent', color: 'text-green-600' }
  if (score >= 0.6) return { label: 'Pertinent', color: 'text-blue-600' }
  if (score >= 0.4) return { label: 'Similaire', color: 'text-yellow-600' }
  return { label: 'Lié', color: 'text-gray-500' }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SearchResultCard({
  result,
  showScore = false,
  highlightQuery,
}: SearchResultCardProps) {
  const config = ENTITY_CONFIG[result.entityType]
  const Icon = config.icon
  const href = `${config.path}/${result.sourceId}`

  // Relevance indicator
  const relevance = showScore ? getRelevanceLabel(result.finalScore) : null

  return (
    <Link
      href={href}
      className="group block bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-primary hover:shadow-md transition-all"
    >
      {/* Image placeholder - would need actual image from source entity */}
      <div className="relative aspect-square bg-gray-100">
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <Icon className="size-12 opacity-50" />
        </div>

        {/* Entity type badge */}
        <span
          className={cn(
            'absolute top-2 start-2 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1',
            config.color
          )}
        >
          <Icon className="size-3" />
          {config.label}
        </span>

        {/* Promoted badge */}
        {result.isPromoted && (
          <span className="absolute top-2 end-2 bg-amber-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <SparklesIcon className="size-3" />
            Sponsorisé
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {result.categoryId && (
          <p className="text-xs text-gray-500 mb-1">
            Catégorie {result.categoryId}
          </p>
        )}

        {/* Title */}
        <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
          {result.title}
        </h3>

        {/* Arabic title */}
        {result.titleAr && (
          <p className="text-sm text-gray-600 mt-0.5 line-clamp-1" dir="rtl">
            {result.titleAr}
          </p>
        )}

        {/* Description preview */}
        {result.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {result.description}
          </p>
        )}

        {/* Location */}
        {result.wilayaId && (
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
            <MapPinIcon className="size-3.5" />
            Wilaya {result.wilayaId}
          </p>
        )}

        {/* Price */}
        {result.price !== null && result.price > 0 && (
          <div className="mt-3">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(result.price)} DA
            </span>
          </div>
        )}

        {/* Free indicator for events/coupons */}
        {result.entityType !== 'product' && (result.price === null || result.price === 0) && (
          <div className="mt-3">
            <Badge variant="secondary">Gratuit</Badge>
          </div>
        )}

        {/* Relevance indicator */}
        {relevance && (
          <div className={cn('mt-2 text-xs flex items-center gap-1', relevance.color)}>
            <div
              className="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden"
              title={`Score: ${Math.round(result.finalScore * 100)}%`}
            >
              <div
                className={cn('h-full rounded-full', config.color)}
                style={{ width: `${result.finalScore * 100}%` }}
              />
            </div>
            <span>{relevance.label}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
