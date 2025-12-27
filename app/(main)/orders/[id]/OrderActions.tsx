'use client'

/**
 * Order Actions Component
 * Handles status updates for orders
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateOrderStatus } from '@/features/orders/actions/orders.actions'

type OrderActionsProps = {
  orderId: string
  status: string
  isBuyer: boolean
  isSeller: boolean
}

export function OrderActions({ orderId, status, isBuyer, isSeller }: OrderActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAction = async (newStatus: 'shipped' | 'delivered' | 'cancelled') => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateOrderStatus(orderId, newStatus)

      if (!result.success) {
        setError(result.error)
        return
      }

      router.refresh()
    } catch {
      setError('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  // No actions available
  if (status === 'delivered' || status === 'cancelled') {
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>

      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      <div className="space-y-3">
        {/* Seller can mark as shipped */}
        {isSeller && (status === 'pending' || status === 'paid') && (
          <button
            onClick={() => handleAction('shipped')}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? 'Chargement...' : 'Marquer comme expédié'}
          </button>
        )}

        {/* Buyer can confirm delivery */}
        {isBuyer && status === 'shipped' && (
          <button
            onClick={() => handleAction('delivered')}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Chargement...' : 'Confirmer la réception'}
          </button>
        )}

        {/* Both can cancel pending orders */}
        {(isBuyer || isSeller) && status === 'pending' && (
          <button
            onClick={() => handleAction('cancelled')}
            disabled={isLoading}
            className="w-full py-3 px-4 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            {isLoading ? 'Chargement...' : 'Annuler la commande'}
          </button>
        )}
      </div>

      {/* Info text */}
      {isSeller && status === 'pending' && (
        <p className="mt-4 text-sm text-gray-500">
          Une fois expédié, l&apos;acheteur pourra confirmer la réception.
        </p>
      )}
      {isBuyer && status === 'shipped' && (
        <p className="mt-4 text-sm text-gray-500">
          Confirmez uniquement après avoir reçu le produit en bon état.
        </p>
      )}
    </div>
  )
}
