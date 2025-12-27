/**
 * Profile Page
 */

import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import { ProfileForm } from '@/features/auth/components/ProfileForm'
import { MerchantProductsList } from '@/features/marketplace/components/MerchantProductsList'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

export const metadata = {
  title: 'Mon profil | RO Line',
  description: 'Gérer votre profil RO Line',
}

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const isMerchant = user.profile?.role === 'merchant'

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Retour au dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Mon profil
        </h1>
        <p className="text-gray-600">
          Gérer vos informations personnelles
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left column - Profile info */}
        <div className="md:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <ProfileForm user={user} />
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <Link
              href="/profile/coupons"
              className="flex items-center gap-3 p-2 rounded-md hover:bg-purple-50 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Mes Coupons</p>
                <p className="text-xs text-gray-500">Voir mes offres sauvegardees</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Informations du compte
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Type</dt>
                <dd className="text-gray-900 capitalize">
                  {user.profile?.role === 'merchant' ? 'Marchand' : 'Étudiant'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Membre depuis</dt>
                <dd className="text-gray-900">
                  {user.profile?.created_at
                    ? new Date(user.profile.created_at).toLocaleDateString('fr-DZ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Wilaya</dt>
                <dd className="text-gray-900">
                  {user.profile?.wilayas?.name || '-'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right column - Products (Merchants only) */}
        {isMerchant && (
          <div className="md:col-span-2">
            <Suspense fallback={<div className="bg-white rounded-lg border p-6 animate-pulse">Chargement...</div>}>
              <MerchantProductsList />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  )
}
