'use client'

/**
 * Pay Button Component
 * Initiates Chargily payment for orders
 */

import { useState } from 'react'
import { createOrderCheckoutSession } from '../actions/checkout.actions'

type PayButtonProps = {
  orderId: string
  amount: number
  disabled?: boolean
}

export function PayButton({ orderId, amount, disabled }: PayButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<'edahabia' | 'cib'>('edahabia')

  const handlePay = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createOrderCheckoutSession(orderId, selectedMethod)

      if (!result.success) {
        setError(result.error)
        return
      }

      // Redirect to Chargily checkout
      window.location.href = result.data.checkoutUrl
    } catch {
      setError('Erreur lors de la création du paiement')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Payment method selection */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setSelectedMethod('edahabia')}
          className={`flex-1 p-3 border rounded-lg text-center transition-colors ${
            selectedMethod === 'edahabia'
              ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="block text-lg font-medium">EDAHABIA</span>
          <span className="text-xs text-gray-500">Algérie Poste</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedMethod('cib')}
          className={`flex-1 p-3 border rounded-lg text-center transition-colors ${
            selectedMethod === 'cib'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="block text-lg font-medium">CIB</span>
          <span className="text-xs text-gray-500">SATIM</span>
        </button>
      </div>

      {/* Error display */}
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={disabled || isLoading}
        className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading
          ? 'Redirection...'
          : `Payer ${amount.toLocaleString('fr-DZ')} DA`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Paiement sécurisé via Chargily Pay
      </p>
    </div>
  )
}
