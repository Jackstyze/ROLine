'use client'

/**
 * Marketplace Tabs Component
 * Switch between Products, Offers and Events views
 */

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

type TabValue = 'products' | 'offers' | 'events'

export function MarketplaceTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentView = (searchParams.get('view') as TabValue) || 'products'

  const switchTab = useCallback(
    (tab: TabValue) => {
      const params = new URLSearchParams()
      if (tab !== 'products') {
        params.set('view', tab)
      }
      router.push(`/marketplace${params.toString() ? '?' + params.toString() : ''}`)
    },
    [router]
  )

  return (
    <div className="flex border-b border-gray-200 mb-6">
      <button
        onClick={() => switchTab('products')}
        className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
          currentView === 'products'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <span className="hidden sm:inline">Produits</span>
      </button>

      <button
        onClick={() => switchTab('offers')}
        className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
          currentView === 'offers'
            ? 'border-purple-600 text-purple-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
        <span className="hidden sm:inline">Offres</span>
      </button>

      <button
        onClick={() => switchTab('events')}
        className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
          currentView === 'events'
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="hidden sm:inline">Evenements</span>
      </button>
    </div>
  )
}
