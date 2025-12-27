/**
 * Offers Grid Component
 * Displays a grid of offer cards
 */

import { OfferCard } from './OfferCard'
import type { PublicCoupon } from '../actions/coupons.actions'

type OffersGridProps = {
  coupons: PublicCoupon[]
  savedCouponIds?: string[]
}

export function OffersGrid({ coupons, savedCouponIds = [] }: OffersGridProps) {
  if (coupons.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Aucune offre disponible
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Revenez bientot pour decouvrir nos nouvelles offres!
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {coupons.map(coupon => (
        <OfferCard
          key={coupon.id}
          coupon={coupon}
          isSaved={savedCouponIds.includes(coupon.id)}
        />
      ))}
    </div>
  )
}
