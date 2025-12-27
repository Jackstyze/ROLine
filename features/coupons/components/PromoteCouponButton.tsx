'use client'

/**
 * Promote Coupon Button - Same system as products
 */

import { useState, useTransition } from 'react'
import { getPromotionPackages, createPromotionPurchase, type PromotionPackage } from '@/features/marketplace/actions/promotion.actions'

type Props = {
  couponId: string
  couponTitle: string
  isPromoted?: boolean
  promotedUntil?: string | null
}

export function PromoteCouponButton({ couponId, couponTitle, isPromoted, promotedUntil }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [packages, setPackages] = useState<PromotionPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleOpen = async () => {
    setIsOpen(true)
    setLoading(true)
    try {
      const pkgs = await getPromotionPackages()
      setPackages(pkgs)
    } catch {
      setError('Erreur chargement des packs')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (packageId: number) => {
    setError(null)
    startTransition(async () => {
      const result = await createPromotionPurchase(couponId, packageId, 'coupon')
      if (result.success) {
        window.location.href = result.data.checkoutUrl
      } else {
        setError(result.error)
      }
    })
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR')

  // Already promoted
  if (isPromoted && promotedUntil) {
    const endDate = new Date(promotedUntil)
    if (endDate > new Date()) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded">
          <span>Promu jusqu'au {formatDate(promotedUntil)}</span>
        </div>
      )
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        Promouvoir
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Promouvoir votre coupon</h2>
              <p className="text-gray-600 text-sm mt-1">{couponTitle}</p>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Chargement...</div>
              ) : error ? (
                <div className="text-red-600 bg-red-50 p-4 rounded">{error}</div>
              ) : (
                <div className="space-y-3">
                  {packages.map(pkg => (
                    <button
                      key={pkg.id}
                      onClick={() => handleSelect(pkg.id)}
                      disabled={isPending}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        pkg.tier === 'featured'
                          ? 'border-yellow-400 bg-yellow-50 hover:border-yellow-500'
                          : pkg.tier === 'premium'
                          ? 'border-blue-400 bg-blue-50 hover:border-blue-500'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{pkg.name}</h3>
                          <p className="text-sm text-gray-600">{pkg.duration_days} jours</p>
                          {pkg.description && <p className="text-xs text-gray-500 mt-1">{pkg.description}</p>}
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold">{pkg.price} DA</span>
                          {pkg.tier === 'featured' && (
                            <span className="block text-xs text-yellow-600 font-medium">TOP</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
