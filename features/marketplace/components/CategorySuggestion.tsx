'use client'

/**
 * Category Suggestion Component
 * AI-powered category suggestion for product creation
 *
 * FEATURES:
 * - Real-time suggestion as user types title
 * - Confidence-based action indicator
 * - Alternative category options
 * - One-click category selection
 * - Graceful fallback when ML unavailable
 */

import { useState, useEffect, useCallback } from 'react'
import {
  SparklesIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  HelpCircleIcon,
  Loader2Icon,
  ChevronDownIcon,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible'
import { useDebounce } from '@/features/search/hooks/useDebounce'
import {
  suggestCategory,
  type CategorySuggestion as CategorySuggestionType,
} from '../actions/categorize.actions'

// =============================================================================
// TYPES
// =============================================================================

type CategorySuggestionProps = {
  /** Product title to analyze */
  title: string
  /** Product description (optional, improves accuracy) */
  description?: string
  /** Current selected category ID */
  currentCategoryId?: number
  /** Callback when category is selected */
  onSelectCategory: (categoryId: number) => void
  /** Minimum title length before suggesting */
  minTitleLength?: number
  /** Additional class names */
  className?: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ACTION_CONFIG = {
  auto_approve: {
    icon: CheckCircleIcon,
    label: 'Catégorie recommandée',
    description: 'Confiance élevée - appliquer automatiquement',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
  },
  suggest: {
    icon: SparklesIcon,
    label: 'Suggestion',
    description: 'Vérifiez et confirmez la catégorie',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  manual_review: {
    icon: HelpCircleIcon,
    label: 'Sélection manuelle requise',
    description: 'Confiance faible - choisissez manuellement',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
  },
  unavailable: {
    icon: AlertCircleIcon,
    label: 'IA non disponible',
    description: 'Sélectionnez la catégorie manuellement',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 border-gray-200',
  },
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CategorySuggestion({
  title,
  description,
  currentCategoryId,
  onSelectCategory,
  minTitleLength = 5,
  className,
}: CategorySuggestionProps) {
  const [suggestion, setSuggestion] = useState<CategorySuggestionType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAlternativesOpen, setIsAlternativesOpen] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)

  // Debounce title to avoid too many API calls
  const debouncedTitle = useDebounce(title, 500)

  // Fetch suggestion when title changes
  useEffect(() => {
    // Skip if title too short
    if (debouncedTitle.length < minTitleLength) {
      setSuggestion(null)
      return
    }

    // Skip if already applied this suggestion
    if (hasApplied && suggestion?.categoryId === currentCategoryId) {
      return
    }

    let cancelled = false

    async function fetchSuggestion() {
      setIsLoading(true)

      try {
        const result = await suggestCategory(debouncedTitle, description)

        if (!cancelled) {
          setSuggestion(result)
          setHasApplied(false)

          // Auto-apply if high confidence and no current selection
          if (
            result.action === 'auto_approve' &&
            result.categoryId &&
            !currentCategoryId
          ) {
            onSelectCategory(result.categoryId)
            setHasApplied(true)
          }
        }
      } catch (error) {
        console.error('[CATEGORY_SUGGESTION] Failed:', error)
        if (!cancelled) {
          setSuggestion(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchSuggestion()

    return () => {
      cancelled = true
    }
  }, [debouncedTitle, description, minTitleLength, currentCategoryId, onSelectCategory, hasApplied, suggestion?.categoryId])

  // Handle category selection
  const handleSelectCategory = useCallback(
    (categoryId: number) => {
      onSelectCategory(categoryId)
      setHasApplied(true)
    },
    [onSelectCategory]
  )

  // Don't render if title too short
  if (title.length < minTitleLength) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Loader2Icon className="size-4 animate-spin" />
        Analyse de la catégorie...
      </div>
    )
  }

  // No suggestion
  if (!suggestion) {
    return null
  }

  const actionConfig = ACTION_CONFIG[suggestion.action]
  const ActionIcon = actionConfig.icon
  const isCurrentCategory = suggestion.categoryId === currentCategoryId

  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        actionConfig.bgColor,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <ActionIcon className={cn('size-5', actionConfig.color)} />
          <div>
            <p className={cn('font-medium text-sm', actionConfig.color)}>
              {actionConfig.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {actionConfig.description}
            </p>
          </div>
        </div>

        {/* Confidence badge */}
        {suggestion.confidence > 0 && (
          <Badge variant="outline" className="text-xs">
            {Math.round(suggestion.confidence * 100)}%
          </Badge>
        )}
      </div>

      {/* Suggested category */}
      {suggestion.categoryId && suggestion.categoryName && (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{suggestion.categoryName}</p>
              {suggestion.categoryNameAr && (
                <p className="text-sm text-muted-foreground" dir="rtl">
                  {suggestion.categoryNameAr}
                </p>
              )}
            </div>

            {isCurrentCategory ? (
              <Badge variant="default" className="gap-1">
                <CheckCircleIcon className="size-3" />
                Sélectionnée
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSelectCategory(suggestion.categoryId!)}
              >
                Appliquer
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {suggestion.error && (
        <p className="mt-2 text-sm text-destructive">
          {suggestion.error}
        </p>
      )}

      {/* Alternative categories */}
      {suggestion.alternatives.length > 0 && (
        <Collapsible
          open={isAlternativesOpen}
          onOpenChange={setIsAlternativesOpen}
          className="mt-3"
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span>Autres suggestions ({suggestion.alternatives.length})</span>
              <ChevronDownIcon
                className={cn(
                  'size-4 transition-transform',
                  isAlternativesOpen && 'rotate-180'
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {suggestion.alternatives.map((alt) => (
              <div
                key={alt.categoryId}
                className="flex items-center justify-between p-2 rounded bg-background/50"
              >
                <div>
                  <p className="text-sm font-medium">{alt.categoryName}</p>
                  <p className="text-xs text-muted-foreground">
                    Confiance: {Math.round(alt.confidence * 100)}%
                  </p>
                </div>
                {alt.categoryId === currentCategoryId ? (
                  <Badge variant="secondary" className="text-xs">
                    Actuelle
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSelectCategory(alt.categoryId)}
                  >
                    Utiliser
                  </Button>
                )}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Processing time */}
      {suggestion.processingTimeMs > 0 && (
        <p className="mt-2 text-xs text-muted-foreground text-end">
          Analysé en {Math.round(suggestion.processingTimeMs)}ms
        </p>
      )}
    </div>
  )
}
