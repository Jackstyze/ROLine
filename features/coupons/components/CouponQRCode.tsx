'use client'

/**
 * Coupon QR Code Component
 * Generates a personalized QR code for saved coupons
 */

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

type Props = {
  couponId: string
  couponCode: string | null
  couponTitle: string
  userId: string
  userName: string
}

export function CouponQRCode({ couponId, couponCode, couponTitle, userId, userName }: Props) {
  const [showModal, setShowModal] = useState(false)

  // Generate QR data with user info (nominatif)
  const qrData = JSON.stringify({
    type: 'coupon',
    couponId,
    code: couponCode,
    userId,
    userName,
    generatedAt: new Date().toISOString(),
  })

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        title="Afficher QR Code"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Mon Coupon
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Coupon info */}
            <div className="text-center mb-4">
              <p className="font-medium text-gray-900">{couponTitle}</p>
              {couponCode && (
                <p className="text-sm text-purple-600 font-mono mt-1">{couponCode}</p>
              )}
            </div>

            {/* QR Code */}
            <div className="flex justify-center p-4 bg-white border border-gray-200 rounded-lg">
              <QRCodeSVG
                value={qrData}
                size={200}
                level="H"
                includeMargin
                imageSettings={{
                  src: '/logo.svg',
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
            </div>

            {/* User info (nominatif) */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500">Ce coupon est nominatif</p>
              <p className="text-sm font-medium text-gray-700 mt-1">{userName}</p>
            </div>

            {/* Instructions */}
            <p className="mt-4 text-xs text-gray-500 text-center">
              Presentez ce QR code au marchand pour beneficier de votre reduction
            </p>
          </div>
        </div>
      )}
    </>
  )
}
