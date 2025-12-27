'use client'

/**
 * Product Filters Component
 * Client-side filtering with URL search params
 */

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import wilayas from '@/data/wilayas.json'
import categories from '@/data/categories.json'

export function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isOpen, setIsOpen] = useState(false)

  // Current filter values from URL
  const currentWilaya = searchParams.get('wilaya') || ''
  const currentCategory = searchParams.get('category') || ''
  const currentMinPrice = searchParams.get('minPrice') || ''
  const currentMaxPrice = searchParams.get('maxPrice') || ''
  const currentSearch = searchParams.get('search') || ''

  // Update URL with new filter
  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      // Reset to page 1 when filtering
      params.delete('page')

      router.push(`/marketplace?${params.toString()}`)
    },
    [router, searchParams]
  )

  // Clear all filters
  const clearFilters = () => {
    router.push('/marketplace')
  }

  const hasActiveFilters =
    currentWilaya || currentCategory || currentMinPrice || currentMaxPrice || currentSearch

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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Filters content */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:block mt-4 md:mt-0 space-y-4`}>
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Rechercher
          </label>
          <input
            id="search"
            type="text"
            placeholder="Nom du produit..."
            defaultValue={currentSearch}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateFilter('search', e.currentTarget.value)
              }
            }}
            onBlur={(e) => updateFilter('search', e.target.value)}
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Catégorie
          </label>
          <select
            id="category"
            value={currentCategory}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((cat) => (
              <optgroup key={cat.id} label={cat.name}>
                {cat.children?.map((subcat) => (
                  <option key={subcat.id} value={subcat.id}>
                    {subcat.name}
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
            onChange={(e) => updateFilter('wilaya', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Toutes les wilayas</option>
            {wilayas.map((w) => (
              <option key={w.id} value={w.id}>
                {w.id}. {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prix (DA)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              defaultValue={currentMinPrice}
              className="w-1/2 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              onBlur={(e) => updateFilter('minPrice', e.target.value)}
            />
            <input
              type="number"
              placeholder="Max"
              defaultValue={currentMaxPrice}
              className="w-1/2 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              onBlur={(e) => updateFilter('maxPrice', e.target.value)}
            />
          </div>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="w-full text-sm text-red-600 hover:text-red-700"
          >
            Effacer les filtres
          </button>
        )}
      </div>
    </div>
  )
}
