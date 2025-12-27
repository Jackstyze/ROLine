/**
 * Mes Coupons Page
 * Display user's saved coupons wallet
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import { getSavedCoupons } from '@/features/coupons/actions/coupons.actions'
import { SavedCouponsList } from '@/features/coupons/components/SavedCouponsList'

export const metadata = {
  title: 'Mes Coupons | RO Line',
  description: 'Vos coupons sauvegardés',
}

async function SavedCouponsContent({ userId, userName }: { userId: string; userName: string }) {
  const coupons = await getSavedCoupons()
  return <SavedCouponsList coupons={coupons} userId={userId} userName={userName} />
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-purple-200 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function MesCouponsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-green-700 hover:text-green-800 font-medium"
        >
          ← Retour au dashboard
        </Link>
        <div className="glass rounded-2xl p-6 mt-4 relative overflow-hidden">
          <div className="absolute inset-0 algerian-pattern opacity-[0.03]" />
          <div className="relative flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-red-400 to-red-600 rounded-full" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mes Coupons</h1>
              <p className="text-muted-foreground">Retrouvez tous vos coupons sauvegardés</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick link to discover offers */}
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center justify-between">
          <p className="text-sm text-red-800">
            Découvrez plus d'offres dans le marketplace
          </p>
          <Link
            href="/marketplace?tab=offers"
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all"
          >
            Voir les offres
          </Link>
        </div>
      </div>

      {/* Saved Coupons */}
      <Suspense fallback={<LoadingSkeleton />}>
        <SavedCouponsContent
          userId={user.id}
          userName={user.profile?.full_name || user.email || 'Utilisateur'}
        />
      </Suspense>
    </div>
  )
}
