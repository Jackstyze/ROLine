'use client'

/**
 * Events Filters Component
 * Client-side filtering for events
 */

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import categories from '@/data/categories.json'
import wilayas from '@/data/wilayas.json'

type Category = {
  id: number
  name: string
  name_ar: string
  children?: { id: number; name: string; name_ar: string }[]
}

export function EventsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isOpen, setIsOpen] = useState(false)

  // Current filter values from URL
  const currentCategory = searchParams.get('category') || ''
  const currentWilaya = searchParams.get('wilaya') || ''
  const currentFree = searchParams.get('free') || ''
  const currentOnline = searchParams.get('online') || ''

  // Update URL with new filter
  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())

      // Preserve the view param
      params.set('view', 'events')

      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      router.push(`/marketplace?${params.toString()}`)
    },
    [router, searchParams]
  )

  // Clear all filters
  const clearFilters = () => {
    router.push('/marketplace?view=events')
  }

  const hasActiveFilters = currentCategory || currentWilaya || currentFree || currentOnline

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Mobile toggle */}
      <button
        className="md:hidden w-full flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium">Filtres</span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filters content */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:block mt-4 md:mt-0 space-y-4`}>
        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Categorie
          </label>
          <select
            id="category"
            value={currentCategory}
            onChange={e => updateFilter('category', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Toutes les categories</option>
            {(categories as Category[]).map(cat => (
              <optgroup key={cat.id} label={cat.name}>
                <option value={cat.id}>{cat.name}</option>
                {cat.children?.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Wilaya */}
        <div>
          <label htmlFor="wilaya" className="block text-sm font-medium text-gray-700 mb-1">
            Wilaya
          </label>
          <select
            id="wilaya"
            value={currentWilaya}
            onChange={e => updateFilter('wilaya', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Toutes les wilayas</option>
            {wilayas.map(w => (
              <option key={w.id} value={w.id}>
                {w.id}. {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Free events */}
        <div>
          <label htmlFor="free" className="block text-sm font-medium text-gray-700 mb-1">
            Prix
          </label>
          <select
            id="free"
            value={currentFree}
            onChange={e => updateFilter('free', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Tous les prix</option>
            <option value="true">Gratuit uniquement</option>
            <option value="false">Payant uniquement</option>
          </select>
        </div>

        {/* Online events */}
        <div>
          <label htmlFor="online" className="block text-sm font-medium text-gray-700 mb-1">
            Format
          </label>
          <select
            id="online"
            value={currentOnline}
            onChange={e => updateFilter('online', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Tous les formats</option>
            <option value="true">En ligne</option>
            <option value="false">En presentiel</option>
          </select>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="w-full text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Effacer les filtres
          </button>
        )}
      </div>
    </div>
  )
}
