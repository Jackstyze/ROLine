/**
 * Marketplace Page
 * Lists products, offers and events with tabs, filters and pagination
 */

import { Suspense } from 'react'
import { getProducts } from '@/features/marketplace/actions/products.actions'
import { getPublicCoupons, getSavedCoupons } from '@/features/coupons/actions/coupons.actions'
import { getPublicEvents } from '@/features/events/actions/events.actions'
import { ProductGrid } from '@/features/marketplace/components/ProductGrid'
import { ProductFilters } from '@/features/marketplace/components/ProductFilters'
import { MarketplaceTabs } from '@/features/marketplace/components/MarketplaceTabs'
import { OffersGrid } from '@/features/coupons/components/OffersGrid'
import { OffersFilters } from '@/features/coupons/components/OffersFilters'
import { EventsGrid } from '@/features/events/components/EventsGrid'
import { EventsFilters } from '@/features/events/components/EventsFilters'
import Link from 'next/link'

export const metadata = {
  title: 'Marketplace | RO Line',
  description: 'Decouvrez les produits, offres et evenements sur RO Line',
}

type SearchParams = {
  view?: 'products' | 'offers' | 'events'
  page?: string
  category?: string
  wilaya?: string
  minPrice?: string
  maxPrice?: string
  search?: string
  discountType?: string
  expiring?: string
  free?: string
  online?: string
}

// ============ Products View ============

async function ProductsList({ searchParams }: { searchParams: SearchParams }) {
  const page = Number(searchParams.page) || 1
  const filters = {
    page,
    categoryId: searchParams.category ? Number(searchParams.category) : undefined,
    wilayaId: searchParams.wilaya ? Number(searchParams.wilaya) : undefined,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    search: searchParams.search,
  }

  const { products, total, hasMore } = await getProducts(filters)

  return (
    <>
      <p className="text-sm text-gray-500 mb-4">
        {total} produit{total > 1 ? 's' : ''} trouve{total > 1 ? 's' : ''}
      </p>

      <ProductGrid products={products} />

      {(page > 1 || hasMore) && (
        <div className="mt-8 flex justify-center gap-4">
          {page > 1 && (
            <Link
              href={`/marketplace?${new URLSearchParams({
                ...searchParams,
                page: String(page - 1),
              }).toString()}`}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Precedent
            </Link>
          )}
          <span className="px-4 py-2 text-gray-600">Page {page}</span>
          {hasMore && (
            <Link
              href={`/marketplace?${new URLSearchParams({
                ...searchParams,
                page: String(page + 1),
              }).toString()}`}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Suivant
            </Link>
          )}
        </div>
      )}
    </>
  )
}

// ============ Offers View ============

async function OffersList({ searchParams }: { searchParams: SearchParams }) {
  const filters = {
    categoryId: searchParams.category ? Number(searchParams.category) : undefined,
    discountType: searchParams.discountType,
    expiringWithinDays: searchParams.expiring ? Number(searchParams.expiring) : undefined,
  }

  const [coupons, savedCoupons] = await Promise.all([
    getPublicCoupons(filters),
    getSavedCoupons(),
  ])

  const savedCouponIds = savedCoupons.map(c => c.id)

  return (
    <>
      <p className="text-sm text-gray-500 mb-4">
        {coupons.length} offre{coupons.length > 1 ? 's' : ''} disponible{coupons.length > 1 ? 's' : ''}
      </p>

      <OffersGrid coupons={coupons} savedCouponIds={savedCouponIds} />
    </>
  )
}

// ============ Events View ============

async function EventsList({ searchParams }: { searchParams: SearchParams }) {
  const filters = {
    categoryId: searchParams.category ? Number(searchParams.category) : undefined,
    wilayaId: searchParams.wilaya ? Number(searchParams.wilaya) : undefined,
    isFree: searchParams.free === 'true' ? true : searchParams.free === 'false' ? false : undefined,
    isOnline: searchParams.online === 'true' ? true : searchParams.online === 'false' ? false : undefined,
  }

  const events = await getPublicEvents(filters)

  return (
    <>
      <p className="text-sm text-gray-500 mb-4">
        {events.length} evenement{events.length > 1 ? 's' : ''} a venir
      </p>

      <EventsGrid events={events} />
    </>
  )
}

// ============ Loading States ============

function ProductsLoading() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-5 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-6 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

function OffersLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
          <div className="h-24 bg-purple-200" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EventsLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
          <div className="h-32 bg-blue-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-5 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============ Main Page ============

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const view = params.view || 'products'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-gray-600">
            {view === 'products' && 'Decouvrez les produits de la communaute'}
            {view === 'offers' && 'Profitez des offres exclusives'}
            {view === 'events' && 'Ne manquez aucun evenement'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <MarketplaceTabs />

      {/* Content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          {view === 'products' && <ProductFilters />}
          {view === 'offers' && <OffersFilters />}
          {view === 'events' && <EventsFilters />}
        </aside>

        {/* Main content */}
        <main className="flex-1">
          {view === 'products' && (
            <Suspense fallback={<ProductsLoading />}>
              <ProductsList searchParams={params} />
            </Suspense>
          )}
          {view === 'offers' && (
            <Suspense fallback={<OffersLoading />}>
              <OffersList searchParams={params} />
            </Suspense>
          )}
          {view === 'events' && (
            <Suspense fallback={<EventsLoading />}>
              <EventsList searchParams={params} />
            </Suspense>
          )}
        </main>
      </div>
    </div>
  )
}
