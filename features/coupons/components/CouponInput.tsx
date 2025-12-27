'use client'

/**
 * Coupon Input Component
 * For applying coupon codes at checkout
 */

import { useState, useTransition } from 'react'
import { validateCoupon } from '../actions/coupons.actions'
import type { CouponContext } from '../schemas/coupon.schema'
import type { ValidationResult } from '../types/coupon.types'

type CouponInputProps = {
  context: CouponContext
  onApply: (result: ValidationResult) => void
  onRemove: () => void
  appliedCoupon?: ValidationResult | null
}

export function CouponInput({ context, onApply, onRemove, appliedCoupon }: CouponInputProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleApply = () => {
    if (!code.trim()) return

    setError(null)
    startTransition(async () => {
      const result = await validateCoupon(code.trim(), context)

      if ('error' in result) {
        setError(result.error)
      } else {
        onApply(result)
        setCode('')
      }
    })
  }

  const handleRemove = () => {
    onRemove()
    setCode('')
    setError(null)
  }

  const formatDiscount = (result: ValidationResult) => {
    if (result.discountType === 'percentage') {
      return `-${result.discountAmount.toFixed(0)} DA`
    }
    if (result.discountType === 'fixed_amount') {
      return `-${result.discountAmount.toFixed(0)} DA`
    }
    if (result.discountType === 'free_shipping') {
      return 'Livraison gratuite'
    }
    return 'Appliqué'
  }

  // Show applied coupon
  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-green-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-medium text-green-800">{appliedCoupon.couponTitle}</p>
            <p className="text-xs text-green-600">{formatDiscount(appliedCoupon)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="text-green-600 hover:text-green-800 p-1"
          aria-label="Retirer le coupon"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  // Show input form
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Code promo"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isPending}
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={isPending || !code.trim()}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? '...' : 'Appliquer'}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
