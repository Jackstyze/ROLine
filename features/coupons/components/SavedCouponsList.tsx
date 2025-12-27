'use client'

/**
 * Saved Coupons List Component
 * Displays user's saved coupons with status and actions
 */

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { removeSavedCoupon } from '../actions/coupons.actions'
import type { PublicCoupon } from '../actions/coupons.actions'
import { CouponQRCode } from './CouponQRCode'

type SavedCoupon = PublicCoupon & {
  saved_at: string
  used_at: string | null
}

type Props = {
  coupons: SavedCoupon[]
  userId: string
  userName: string
}

function getCouponStatus(coupon: SavedCoupon): 'valid' | 'expired' | 'used' {
  if (coupon.used_at) return 'used'
  if (coupon.end_date && new Date(coupon.end_date) < new Date()) return 'expired'
  return 'valid'
}

function StatusBadge({ status }: { status: 'valid' | 'expired' | 'used' }) {
  const styles = {
    valid: 'bg-green-100 text-green-800',
    expired: 'bg-gray-100 text-gray-600',
    used: 'bg-blue-100 text-blue-800',
  }
  const labels = {
    valid: 'Valide',
    expired: 'Expire',
    used: 'Utilise',
  }
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

function formatDiscount(type: string, value: number | null): string {
  switch (type) {
    case 'percentage':
      return `-${value}%`
    case 'fixed_amount':
      return `-${value} DA`
    case 'free_shipping':
      return 'Livraison gratuite'
    default:
      return ''
  }
}

function SavedCouponCard({ coupon, userId, userName }: { coupon: SavedCoupon; userId: string; userName: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const status = getCouponStatus(coupon)

  const handleRemove = () => {
    startTransition(async () => {
      await removeSavedCoupon(coupon.id)
      router.refresh()
    })
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${status !== 'valid' ? 'opacity-60' : ''}`}>
      <div className="flex">
        {/* Left: Discount badge */}
        <div className="w-24 bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
          <span className="text-lg font-bold text-center px-2">
            {formatDiscount(coupon.discount_type, coupon.discount_value)}
          </span>
        </div>

        {/* Right: Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">{coupon.title}</h3>
                <StatusBadge status={status} />
              </div>
              <p className="text-sm text-gray-500">
                {coupon.merchant?.full_name || 'Offre RO Line'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {status === 'valid' && (
                <>
                  <CouponQRCode
                    couponId={coupon.id}
                    couponCode={coupon.code}
                    couponTitle={coupon.title}
                    userId={userId}
                    userName={userName}
                  />
                  <button
                    onClick={handleRemove}
                    disabled={isPending}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md disabled:opacity-50"
                    title="Retirer de mes coupons"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            {/* Coupon code */}
            {coupon.code && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="font-mono font-medium">{coupon.code}</span>
              </div>
            )}

            {/* Expiry */}
            {coupon.end_date && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  {status === 'expired' ? 'Expire le' : 'Expire le'}{' '}
                  {new Date(coupon.end_date).toLocaleDateString('fr-DZ')}
                </span>
              </div>
            )}

            {/* Saved date */}
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>
                Sauvegarde le {new Date(coupon.saved_at).toLocaleDateString('fr-DZ')}
              </span>
            </div>
          </div>

          {/* Min purchase notice */}
          {coupon.min_purchase_amount && coupon.min_purchase_amount > 0 && status === 'valid' && (
            <p className="mt-2 text-xs text-orange-600">
              Achat minimum: {coupon.min_purchase_amount} DA
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function SavedCouponsList({ coupons, userId, userName }: Props) {
  if (coupons.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
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
          Aucun coupon sauvegarde
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Parcourez les offres du marketplace pour trouver des coupons
        </p>
      </div>
    )
  }

  // Separate valid vs expired/used
  const validCoupons = coupons.filter(c => getCouponStatus(c) === 'valid')
  const otherCoupons = coupons.filter(c => getCouponStatus(c) !== 'valid')

  return (
    <div className="space-y-6">
      {/* Valid coupons */}
      {validCoupons.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Coupons actifs ({validCoupons.length})
          </h2>
          <div className="space-y-3">
            {validCoupons.map(coupon => (
              <SavedCouponCard key={coupon.id} coupon={coupon} userId={userId} userName={userName} />
            ))}
          </div>
        </div>
      )}

      {/* Expired/Used coupons */}
      {otherCoupons.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-3">
            Historique ({otherCoupons.length})
          </h2>
          <div className="space-y-3">
            {otherCoupons.map(coupon => (
              <SavedCouponCard key={coupon.id} coupon={coupon} userId={userId} userName={userName} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
