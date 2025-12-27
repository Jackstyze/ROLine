/**
 * Dashboard Page
 */

import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import { MerchantProductsList } from '@/features/marketplace/components/MerchantProductsList'
import { MerchantCouponsList } from '@/features/coupons/components/MerchantCouponsList'
import { MerchantEventsList } from '@/features/events/components/MerchantEventsList'
import Link from 'next/link'
import { Suspense } from 'react'

export const metadata = {
  title: 'Dashboard | RO Line',
  description: 'Votre tableau de bord RO Line',
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  const isMerchant = user?.profile?.role === 'merchant'

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenue, {user?.profile?.full_name || 'Utilisateur'} !
        </h1>
        <p className="text-gray-600">
          Votre tableau de bord RO Line
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Marketplace */}
        <Link
          href="/marketplace"
          className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
        >
          <span className="text-3xl mb-4 block">🛒</span>
          <h3 className="font-medium text-gray-900">Marketplace</h3>
          <p className="text-sm text-gray-500">
            Découvrir les produits et offres
          </p>
        </Link>

        {/* Orders */}
        <Link
          href="/orders"
          className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
        >
          <span className="text-3xl mb-4 block">📦</span>
          <h3 className="font-medium text-gray-900">Mes commandes</h3>
          <p className="text-sm text-gray-500">
            Suivre vos achats
          </p>
        </Link>

        {/* Sell (Merchants only) */}
        {isMerchant && (
          <Link
            href="/sell"
            className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-green-500 transition-colors"
          >
            <span className="text-3xl mb-4 block">💰</span>
            <h3 className="font-medium text-gray-900">Vendre</h3>
            <p className="text-sm text-gray-500">
              Publier un nouveau produit
            </p>
          </Link>
        )}

        {/* Coupons (Merchants only) */}
        {isMerchant && (
          <Link
            href="/dashboard/coupons/new"
            className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-purple-500 transition-colors"
          >
            <span className="text-3xl mb-4 block">🎟️</span>
            <h3 className="font-medium text-gray-900">Coupons</h3>
            <p className="text-sm text-gray-500">
              Creer des codes promo
            </p>
          </Link>
        )}

        {/* Events (Merchants only) */}
        {isMerchant && (
          <Link
            href="/dashboard/events/new"
            className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-indigo-500 transition-colors"
          >
            <span className="text-3xl mb-4 block">📅</span>
            <h3 className="font-medium text-gray-900">Evenements</h3>
            <p className="text-sm text-gray-500">
              Creer un evenement
            </p>
          </Link>
        )}

        {/* Profile */}
        <Link
          href="/profile"
          className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
        >
          <span className="text-3xl mb-4 block">👤</span>
          <h3 className="font-medium text-gray-900">Mon profil</h3>
          <p className="text-sm text-gray-500">
            Gérer vos informations
          </p>
        </Link>
      </div>

      {/* Merchant Products */}
      {isMerchant && (
        <Suspense fallback={<div className="bg-white rounded-lg border p-6 animate-pulse">Chargement...</div>}>
          <MerchantProductsList />
        </Suspense>
      )}

      {/* Merchant Coupons */}
      {isMerchant && (
        <Suspense fallback={<div className="bg-white rounded-lg border p-6 animate-pulse">Chargement...</div>}>
          <MerchantCouponsList />
        </Suspense>
      )}

      {/* Merchant Events */}
      {isMerchant && (
        <Suspense fallback={<div className="bg-white rounded-lg border p-6 animate-pulse">Chargement...</div>}>
          <MerchantEventsList />
        </Suspense>
      )}
    </div>
  )
}
