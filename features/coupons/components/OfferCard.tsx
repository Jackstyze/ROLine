'use client'

/**
 * Offer Card Component
 * Displays a single coupon/offer in Groupon style
 */

import { useTransition } from 'react'
import { saveCouponToWallet, type PublicCoupon } from '../actions/coupons.actions'

type OfferCardProps = {
  coupon: PublicCoupon
  isSaved?: boolean
}

export function OfferCard({ coupon, isSaved = false }: OfferCardProps) {
  const [isPending, startTransition] = useTransition()

  // Format discount display
  const getDiscountDisplay = () => {
    if (coupon.discount_type === 'percentage') {
      return `-${coupon.discount_value}%`
    }
    if (coupon.discount_type === 'fixed_amount') {
      return `-${coupon.discount_value} DA`
    }
    if (coupon.discount_type === 'free_shipping') {
      return 'Livraison gratuite'
    }
    return 'Offre spéciale'
  }

  // Calculate days until expiry
  const getDaysUntilExpiry = () => {
    if (!coupon.end_date) return null
    const endDate = new Date(coupon.end_date)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysLeft = getDaysUntilExpiry()
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7

  // Handle save coupon
  const handleSave = () => {
    startTransition(async () => {
      const result = await saveCouponToWallet(coupon.id)
      if (!result.success) {
        alert(result.error)
      }
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-purple-500 hover:shadow-md transition-all">
      {/* Header with discount */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4 text-white">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{getDiscountDisplay()}</span>
          {coupon.target_audience === 'students' && (
            <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
              Etudiants
            </span>
          )}
        </div>
        {coupon.min_purchase_amount && coupon.min_purchase_amount > 0 && (
          <p className="text-sm text-purple-200 mt-1">
            Min. {coupon.min_purchase_amount} DA
          </p>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 line-clamp-2">
          {coupon.title}
        </h3>
        {coupon.title_ar && (
          <p className="text-sm text-gray-600 mt-1" dir="rtl">
            {coupon.title_ar}
          </p>
        )}

        {/* Merchant or RO Line */}
        <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {coupon.merchant?.full_name || 'RO Line'}
        </p>

        {/* Description */}
        {coupon.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {coupon.description}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          {/* Usage count */}
          {coupon.max_total_uses && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {coupon.current_uses} utilisés
            </span>
          )}

          {/* Expiry */}
          {daysLeft !== null && (
            <span className={`flex items-center gap-1 ${isExpiringSoon ? 'text-red-500 font-medium' : ''}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {daysLeft <= 0 ? 'Expire aujourd\'hui' : `${daysLeft}j restants`}
            </span>
          )}
        </div>

        {/* Coupon code if visible */}
        {coupon.code && (
          <div className="mt-3 bg-gray-50 border border-dashed border-gray-300 rounded px-3 py-2 text-center">
            <span className="text-xs text-gray-500">Code:</span>
            <span className="ml-2 font-mono font-bold text-gray-900">{coupon.code}</span>
          </div>
        )}
      </div>

      {/* Action button */}
      <div className="px-4 pb-4">
        {isSaved ? (
          <div className="w-full py-2 px-4 bg-green-100 text-green-700 text-center rounded-lg font-medium">
            Sauvegardé
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Enregistrement...' : 'Obtenir le coupon'}
          </button>
        )}
      </div>
    </div>
  )
}
