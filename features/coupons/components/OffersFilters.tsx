'use client'

/**
 * Offers Filters Component
 * Client-side filtering for coupons/offers
 */

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import categories from '@/data/categories.json'

type Category = {
  id: number
  name: string
  name_ar: string
  children?: { id: number; name: string; name_ar: string }[]
}

export function OffersFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isOpen, setIsOpen] = useState(false)

  // Current filter values from URL
  const currentCategory = searchParams.get('category') || ''
  const currentDiscountType = searchParams.get('discountType') || ''
  const currentExpiring = searchParams.get('expiring') || ''

  // Update URL with new filter
  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())

      // Preserve the view param
      params.set('view', 'offers')

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
    router.push('/marketplace?view=offers')
  }

  const hasActiveFilters = currentCategory || currentDiscountType || currentExpiring

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
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
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

        {/* Discount Type */}
        <div>
          <label htmlFor="discountType" className="block text-sm font-medium text-gray-700 mb-1">
            Type de reduction
          </label>
          <select
            id="discountType"
            value={currentDiscountType}
            onChange={e => updateFilter('discountType', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          >
            <option value="">Tous les types</option>
            <option value="percentage">Pourcentage (%)</option>
            <option value="fixed_amount">Montant fixe (DA)</option>
            <option value="free_shipping">Livraison gratuite</option>
          </select>
        </div>

        {/* Expiring Soon */}
        <div>
          <label htmlFor="expiring" className="block text-sm font-medium text-gray-700 mb-1">
            Expire bientot
          </label>
          <select
            id="expiring"
            value={currentExpiring}
            onChange={e => updateFilter('expiring', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          >
            <option value="">Toutes les offres</option>
            <option value="7">Dans 7 jours</option>
            <option value="14">Dans 14 jours</option>
            <option value="30">Dans 30 jours</option>
          </select>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="w-full text-sm text-purple-600 hover:text-purple-800 underline"
          >
            Effacer les filtres
          </button>
        )}
      </div>
    </div>
  )
}
