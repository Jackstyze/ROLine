/**
 * Marketplace Page - v0.1
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
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Store, Tag, Calendar } from 'lucide-react'

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
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{total}</span> produit{total > 1 ? 's' : ''} trouve{total > 1 ? 's' : ''}
        </p>
      </div>

      <ProductGrid products={products} />

      {(page > 1 || hasMore) && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/marketplace?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}`}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Precedent
              </Link>
            </Button>
          )}
          <Badge variant="secondary" className="px-4 py-2">
            Page {page}
          </Badge>
          {hasMore && (
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/marketplace?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`}>
                Suivant
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
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
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{coupons.length}</span> offre{coupons.length > 1 ? 's' : ''} disponible{coupons.length > 1 ? 's' : ''}
        </p>
      </div>

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
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{events.length}</span> evenement{events.length > 1 ? 's' : ''} a venir
        </p>
      </div>

      <EventsGrid events={events} />
    </>
  )
}

// ============ Loading States ============

function ProductsLoading() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-100" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-100 rounded-full w-1/3" />
            <div className="h-5 bg-gray-100 rounded-full" />
            <div className="h-4 bg-gray-100 rounded-full w-1/2" />
            <div className="h-6 bg-gray-100 rounded-full w-2/3" />
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
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
          <div className="h-24 bg-gradient-to-r from-red-100 to-red-50" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-100 rounded-full" />
            <div className="h-4 bg-gray-100 rounded-full w-2/3" />
            <div className="h-10 bg-gray-100 rounded-xl" />
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
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
          <div className="h-32 bg-gradient-to-r from-emerald-100 to-emerald-50" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-100 rounded-full w-1/4" />
            <div className="h-5 bg-gray-100 rounded-full" />
            <div className="h-4 bg-gray-100 rounded-full w-3/4" />
            <div className="h-4 bg-gray-100 rounded-full w-1/2" />
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

  const viewConfig = {
    products: { icon: Store, title: 'Produits', desc: 'Decouvrez les produits de la communaute', color: 'emerald' },
    offers: { icon: Tag, title: 'Offres', desc: 'Profitez des offres exclusives', color: 'red' },
    events: { icon: Calendar, title: 'Evenements', desc: 'Ne manquez aucun evenement', color: 'emerald' },
  }

  const config = viewConfig[view]
  const Icon = config.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            config.color === 'emerald'
              ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600'
              : 'bg-gradient-to-br from-red-100 to-red-50 text-red-600'
          }`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
            <p className="text-muted-foreground text-sm">{config.desc}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <MarketplaceTabs />

      {/* Content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="glass rounded-2xl p-4">
            {view === 'products' && <ProductFilters />}
            {view === 'offers' && <OffersFilters />}
            {view === 'events' && <EventsFilters />}
          </div>
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
