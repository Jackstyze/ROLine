/**
 * Merchant Coupons List
 * Display and manage coupons in merchant dashboard
 */

import Link from 'next/link'
import { getMerchantCoupons } from '../actions/coupons.actions'
import { ToggleCouponButton } from './ToggleCouponButton'
import { DeleteCouponButton } from './DeleteCouponButton'
import { PromoteCouponButton } from './PromoteCouponButton'

export async function MerchantCouponsList() {
  const coupons = await getMerchantCoupons()

  if (coupons.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-4 block">🎟️</span>
        <p className="text-gray-500 mb-4">Vous n'avez pas encore de coupons</p>
        <Link
          href="/dashboard/coupons/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Créer un coupon
        </Link>
      </div>
    )
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Sans limite'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getDiscountLabel = (coupon: typeof coupons[0]) => {
    switch (coupon.discount_type) {
      case 'percentage':
        return `-${coupon.discount_value}%`
      case 'fixed_amount':
        return `-${coupon.discount_value} DA`
      case 'free_shipping':
        return 'Livraison gratuite'
      case 'access_unlock':
        return 'Accès débloqué'
      default:
        return ''
    }
  }

  const getAppliesToLabel = (appliesTo: string) => {
    const labels: Record<string, string> = {
      products: 'Produits',
      events: 'Événements',
      premium_access: 'Accès premium',
      delivery: 'Livraison',
      ride_share: 'Covoiturage',
      all: 'Tout',
    }
    return labels[appliesTo] || appliesTo
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Mes coupons ({coupons.length})</h2>
        <Link
          href="/dashboard/coupons/new"
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau
        </Link>
      </div>

      <div className="divide-y border rounded-lg bg-white">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {coupon.code ? (
                    <code className="px-2 py-0.5 bg-gray-100 text-gray-800 text-sm font-mono rounded">
                      {coupon.code}
                    </code>
                  ) : (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                      Auto-apply
                    </span>
                  )}
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    coupon.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {coupon.is_active ? 'Actif' : 'Inactif'}
                  </span>
                  {!coupon.is_public && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                      Privé
                    </span>
                  )}
                </div>

                <h3 className="font-medium text-gray-900 mt-1">{coupon.title}</h3>

                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="font-medium text-gray-700">{getDiscountLabel(coupon)}</span>
                  <span>{getAppliesToLabel(coupon.applies_to)}</span>
                  <span>
                    {coupon.current_uses}
                    {coupon.max_total_uses ? `/${coupon.max_total_uses}` : ''} utilisations
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                  <span>Début: {formatDate(coupon.start_date)}</span>
                  <span>Fin: {formatDate(coupon.end_date)}</span>
                </div>
              </div>

              {/* Actions - Note: Coupons are immutable after creation */}
              <div className="flex items-center gap-2">
                {coupon.is_active && (
                  <PromoteCouponButton
                    couponId={coupon.id}
                    couponTitle={coupon.title}
                    isPromoted={coupon.is_featured}
                    promotedUntil={coupon.promoted_until}
                  />
                )}
                <ToggleCouponButton couponId={coupon.id} isActive={coupon.is_active} />
                <DeleteCouponButton couponId={coupon.id} couponTitle={coupon.title} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
