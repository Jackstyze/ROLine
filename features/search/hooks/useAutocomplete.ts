/**
 * Autocomplete Hook
 * Fetches suggestions as user types
 *
 * ARCHITECTURE:
 * - Debounced query to reduce API calls
 * - Stable dependencies to prevent infinite re-renders
 * - Cancellation to prevent stale updates
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useDebounce } from './useDebounce'
import { autocomplete as fetchAutocomplete } from '../actions/search.actions'
import type { AutocompleteResult, EntityType } from '../schemas/search.schema'

// =============================================================================
// TYPES
// =============================================================================

type UseAutocompleteOptions = {
  /** Minimum characters before fetching */
  minLength?: number
  /** Debounce delay in ms */
  debounceMs?: number
  /** Entity types to search */
  entityTypes?: EntityType[]
  /** Max results */
  limit?: number
}

type UseAutocompleteResult = {
  suggestions: AutocompleteResult[]
  isLoading: boolean
  error: string | null
  query: string
  setQuery: (query: string) => void
  clear: () => void
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_ENTITY_TYPES: EntityType[] = ['product', 'event', 'coupon']
const DEFAULT_MIN_LENGTH = 2
const DEFAULT_DEBOUNCE_MS = 300
const DEFAULT_LIMIT = 5

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for autocomplete search suggestions
 */
export function useAutocomplete(
  options: UseAutocompleteOptions = {}
): UseAutocompleteResult {
  // Stabilize options to prevent unnecessary re-renders
  const minLength = options.minLength ?? DEFAULT_MIN_LENGTH
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS
  const limit = options.limit ?? DEFAULT_LIMIT

  // Memoize entityTypes array to prevent reference changes
  const entityTypesKey = (options.entityTypes ?? DEFAULT_ENTITY_TYPES).sort().join(',')
  const entityTypes = useMemo<EntityType[]>(
    () => (options.entityTypes ?? DEFAULT_ENTITY_TYPES),
    [entityTypesKey]
  )

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track mounted state to prevent updates after unmount
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const debouncedQuery = useDebounce(query, debounceMs)

  const clear = useCallback(() => {
    setQuery('')
    setSuggestions([])
    setError(null)
  }, [])

  useEffect(() => {
    // Skip if query too short
    if (debouncedQuery.length < minLength) {
      setSuggestions([])
      return
    }

    let cancelled = false

    async function fetchSuggestions() {
      setIsLoading(true)
      setError(null)

      try {
        const results = await fetchAutocomplete({
          query: debouncedQuery,
          entityTypes,
          limit,
        })

        if (!cancelled && mountedRef.current) {
          setSuggestions(results)
        }
      } catch (err) {
        if (!cancelled && mountedRef.current) {
          console.error('[AUTOCOMPLETE] Failed:', err)
          setError(err instanceof Error ? err.message : 'Autocomplete failed')
          setSuggestions([])
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    fetchSuggestions()

    return () => {
      cancelled = true
    }
  }, [debouncedQuery, minLength, entityTypes, limit])

  return {
    suggestions,
    isLoading,
    error,
    query,
    setQuery,
    clear,
  }
}
