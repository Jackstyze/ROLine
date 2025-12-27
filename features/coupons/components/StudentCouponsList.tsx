/**
 * Student Coupons List
 * Display saved coupons for students in dashboard
 */

import Link from 'next/link'
import { getSavedCoupons } from '../actions/coupons.actions'
import { Tag, Calendar, ExternalLink } from 'lucide-react'

export async function StudentCouponsList() {
  const coupons = await getSavedCoupons()

  if (coupons.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-4 block">🎟️</span>
        <p className="text-muted-foreground mb-4">Vous n'avez pas de coupons sauvegardés</p>
        <Link
          href="/marketplace?tab=offers"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          Découvrir les offres
        </Link>
      </div>
    )
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Sans limite'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    })
  }

  const getDiscountLabel = (type: string, value: number | null) => {
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

  const getCouponStatus = (coupon: typeof coupons[0]): 'valid' | 'expired' | 'used' => {
    if (coupon.used_at) return 'used'
    if (coupon.end_date && new Date(coupon.end_date) < new Date()) return 'expired'
    return 'valid'
  }

  const validCoupons = coupons.filter(c => getCouponStatus(c) === 'valid')

  return (
    <div className="space-y-3">
      {validCoupons.slice(0, 5).map((coupon) => (
        <div
          key={coupon.id}
          className="flex overflow-hidden bg-white rounded-xl border border-emerald-100"
        >
          {/* Discount badge */}
          <div className="w-20 bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
            <span className="text-sm font-bold text-center px-2">
              {getDiscountLabel(coupon.discount_type, coupon.discount_value)}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm truncate">{coupon.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {coupon.merchant?.full_name || 'Offre RO Line'}
                </p>
              </div>
              <Link
                href="/profile/coupons"
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Voir mes coupons"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {coupon.code && (
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <code className="font-mono">{coupon.code}</code>
                </span>
              )}
              {coupon.end_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Expire le {formatDate(coupon.end_date)}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}

      {validCoupons.length > 5 && (
        <Link
          href="/profile/coupons"
          className="block text-center text-sm text-emerald-600 hover:text-emerald-700 py-2"
        >
          Voir tous mes coupons ({validCoupons.length})
        </Link>
      )}

      {validCoupons.length === 0 && coupons.length > 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Vos {coupons.length} coupons sont expirés ou utilisés
        </div>
      )}
    </div>
  )
}
