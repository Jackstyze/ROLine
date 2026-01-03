'use client'

/**
 * Unified Search Component
 * Cross-entity search with autocomplete
 *
 * FEATURES:
 * - Real-time autocomplete suggestions
 * - Entity type badges (product, event, coupon)
 * - Keyboard navigation
 * - URL-based state for SSR
 * - RTL support (Arabic)
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SearchIcon, XIcon, Loader2Icon, PackageIcon, CalendarIcon, TicketIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/shared/components/ui/command'
import { Badge } from '@/shared/components/ui/badge'
import { useAutocomplete } from '../hooks/useAutocomplete'
import type { EntityType } from '../schemas/search.schema'

// =============================================================================
// TYPES
// =============================================================================

type UnifiedSearchProps = {
  /** Placeholder text */
  placeholder?: string
  /** Entity types to include in search */
  entityTypes?: EntityType[]
  /** Base path for navigation (default: /marketplace) */
  basePath?: string
  /** Additional class names */
  className?: string
  /** Callback when search is submitted */
  onSearch?: (query: string) => void
  /** Show entity type filter tabs */
  showEntityTabs?: boolean
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ENTITY_CONFIG: Record<EntityType, { icon: typeof PackageIcon; label: string; labelAr: string }> = {
  product: { icon: PackageIcon, label: 'Produit', labelAr: 'منتج' },
  event: { icon: CalendarIcon, label: 'Événement', labelAr: 'حدث' },
  coupon: { icon: TicketIcon, label: 'Offre', labelAr: 'عرض' },
}

// =============================================================================
// COMPONENT
// =============================================================================

export function UnifiedSearch({
  placeholder = 'Rechercher produits, événements, offres...',
  entityTypes = ['product', 'event', 'coupon'],
  basePath = '/marketplace',
  className,
  onSearch,
  showEntityTabs = false,
}: UnifiedSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  // URL-based initial value
  const initialQuery = searchParams.get('search') || ''

  const [isOpen, setIsOpen] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<EntityType[]>(entityTypes)

  const {
    suggestions,
    isLoading,
    query,
    setQuery,
    clear,
  } = useAutocomplete({
    entityTypes: selectedTypes,
    minLength: 2,
    debounceMs: 300,
    limit: 8,
  })

  // Initialize with URL value
  useEffect(() => {
    if (initialQuery && !query) {
      setQuery(initialQuery)
    }
  }, [initialQuery, query, setQuery])

  // Submit search
  const submitSearch = useCallback(
    (searchQuery: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim())
      } else {
        params.delete('search')
      }

      // Reset pagination
      params.delete('page')

      // Set entity type filter if not all
      if (selectedTypes.length === 1) {
        params.set('view', selectedTypes[0] === 'product' ? 'products' : selectedTypes[0] + 's')
      }

      router.push(`${basePath}?${params.toString()}`)
      setIsOpen(false)

      if (onSearch) {
        onSearch(searchQuery)
      }
    },
    [router, searchParams, basePath, selectedTypes, onSearch]
  )

  // Handle suggestion selection
  const handleSelect = useCallback(
    (title: string) => {
      setQuery(title)
      submitSearch(title)
    },
    [setQuery, submitSearch]
  )

  // Handle clear
  const handleClear = useCallback(() => {
    clear()
    const params = new URLSearchParams(searchParams.toString())
    params.delete('search')
    params.delete('page')
    router.push(`${basePath}?${params.toString()}`)
    inputRef.current?.focus()
  }, [clear, router, searchParams, basePath])

  // Toggle entity type
  const toggleEntityType = useCallback(
    (type: EntityType) => {
      setSelectedTypes((prev) => {
        if (prev.includes(type)) {
          // Don't allow empty selection
          if (prev.length === 1) return prev
          return prev.filter((t) => t !== type)
        }
        return [...prev, type]
      })
    },
    []
  )

  return (
    <div className={cn('relative w-full', className)}>
      {/* Entity type tabs */}
      {showEntityTabs && (
        <div className="flex gap-2 mb-2">
          {entityTypes.map((type) => {
            const config = ENTITY_CONFIG[type]
            const Icon = config.icon
            const isSelected = selectedTypes.includes(type)

            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleEntityType(type)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <Icon className="size-4" />
                {config.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Search input with autocomplete */}
      <Command
        className="rounded-lg border shadow-sm"
        shouldFilter={false}
      >
        <div className="flex items-center border-b px-3">
          <SearchIcon className="size-4 shrink-0 opacity-50" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                submitSearch(query)
              }
              if (e.key === 'Escape') {
                setIsOpen(false)
              }
            }}
            placeholder={placeholder}
            className="flex h-10 w-full bg-transparent py-3 ps-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          {isLoading && (
            <Loader2Icon className="size-4 shrink-0 animate-spin opacity-50" />
          )}
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-muted"
            >
              <XIcon className="size-4 opacity-50" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {isOpen && query.length >= 2 && (
          <CommandList className="border-t">
            {suggestions.length === 0 && !isLoading && (
              <CommandEmpty>
                Aucun résultat pour &quot;{query}&quot;
              </CommandEmpty>
            )}

            {suggestions.length > 0 && (
              <CommandGroup heading="Suggestions">
                {suggestions.map((suggestion, index) => {
                  const config = ENTITY_CONFIG[suggestion.entityType]
                  const Icon = config.icon

                  return (
                    <CommandItem
                      key={`${suggestion.entityType}-${index}`}
                      value={suggestion.title}
                      onSelect={() => handleSelect(suggestion.title)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-muted-foreground" />
                        <span className="line-clamp-1">{suggestion.title}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {config.label}
                      </Badge>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {/* Quick search action */}
            {query.length >= 2 && (
              <CommandGroup>
                <CommandItem
                  onSelect={() => submitSearch(query)}
                  className="text-primary"
                >
                  <SearchIcon className="size-4 me-2" />
                  Rechercher &quot;{query}&quot;
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        )}
      </Command>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
