/**
 * Dashboard Page - v0.1
 */

import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import { MerchantProductsList } from '@/features/marketplace/components/MerchantProductsList'
import { MerchantCouponsList } from '@/features/coupons/components/MerchantCouponsList'
import { MerchantEventsList } from '@/features/events/components/MerchantEventsList'
import { StudentEventsList } from '@/features/events/components/StudentEventsList'
import { StudentCouponsList } from '@/features/coupons/components/StudentCouponsList'
import { FeaturedProductsSection } from '@/features/marketplace/components/FeaturedProductsSection'
import { LatestProductsSection } from '@/features/marketplace/components/LatestProductsSection'
import { RelatedProductsSection } from '@/features/marketplace/components/RelatedProductsSection'
import { Badge } from '@/shared/components/ui/badge'
import Link from 'next/link'
import { Suspense } from 'react'
import { Store, Package, Tag, Calendar, User, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Dashboard | RO Line',
  description: 'Votre tableau de bord RO Line',
}

const QUICK_ACTIONS = [
  { href: '/marketplace', icon: Store, label: 'Marketplace', desc: 'Découvrir les produits', color: 'emerald', forMerchant: false },
  { href: '/orders', icon: Package, label: 'Mes commandes', desc: 'Suivre vos achats', color: 'emerald', forMerchant: false },
  { href: '/sell', icon: Sparkles, label: 'Vendre', desc: 'Publier un produit', color: 'red', forMerchant: true },
  { href: '/dashboard/coupons/new', icon: Tag, label: 'Coupons', desc: 'Créer des promos', color: 'red', forMerchant: true },
  { href: '/dashboard/events/new', icon: Calendar, label: 'Événements', desc: 'Créer un événement', color: 'emerald', forMerchant: true },
  { href: '/profile', icon: User, label: 'Mon profil', desc: 'Gérer vos infos', color: 'emerald', forMerchant: false },
]

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const isMerchant = user?.profile?.role === 'merchant'

  const actions = QUICK_ACTIONS.filter(action => !action.forMerchant || isMerchant)

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="glass rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 algerian-pattern opacity-[0.03]" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-2xl text-white font-bold">
              {user?.profile?.full_name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-foreground">
                Bienvenue, {user?.profile?.full_name || 'Utilisateur'} !
              </h1>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                {user?.profile?.role === 'merchant' ? 'Vendeur' : 'Étudiant'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Votre tableau de bord RO Line v0.1
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full" />
          <h2 className="text-lg font-bold text-foreground">Actions rapides</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`group block p-5 bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                  action.color === 'emerald' ? 'hover:border-emerald-200' : 'hover:border-red-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${
                  action.color === 'emerald'
                    ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600'
                    : 'bg-gradient-to-br from-red-100 to-red-50 text-red-600'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">{action.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{action.desc}</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Featured Products */}
      <Suspense fallback={<LoadingSkeleton />}>
        <FeaturedProductsSection />
      </Suspense>

      {/* Related Products (Pour Vous) */}
      <Suspense fallback={<LoadingSkeleton />}>
        <RelatedProductsSection />
      </Suspense>

      {/* Latest Products (Dernières Annonces) */}
      <Suspense fallback={<LoadingSkeleton />}>
        <LatestProductsSection />
      </Suspense>

      {/* Merchant Sections */}
      {isMerchant && (
        <>
          {/* Products */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-red-400 to-red-600 rounded-full" />
              <h2 className="text-lg font-bold text-foreground">Mes produits</h2>
            </div>
            <div className="glass rounded-2xl p-6">
              <Suspense fallback={<LoadingSkeleton />}>
                <MerchantProductsList />
              </Suspense>
            </div>
          </div>

          {/* Coupons */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full" />
              <h2 className="text-lg font-bold text-foreground">Mes coupons</h2>
            </div>
            <div className="glass rounded-2xl p-6">
              <Suspense fallback={<LoadingSkeleton />}>
                <MerchantCouponsList />
              </Suspense>
            </div>
          </div>

          {/* Events */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-red-400 to-red-600 rounded-full" />
              <h2 className="text-lg font-bold text-foreground">Mes événements</h2>
            </div>
            <div className="glass rounded-2xl p-6">
              <Suspense fallback={<LoadingSkeleton />}>
                <MerchantEventsList />
              </Suspense>
            </div>
          </div>
        </>
      )}

      {/* Student Sections */}
      {!isMerchant && (
        <>
          {/* My Events */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full" />
              <h2 className="text-lg font-bold text-foreground">Mes événements</h2>
            </div>
            <div className="glass rounded-2xl p-6">
              <Suspense fallback={<LoadingSkeleton />}>
                <StudentEventsList />
              </Suspense>
            </div>
          </div>

          {/* My Coupons */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-red-400 to-red-600 rounded-full" />
              <h2 className="text-lg font-bold text-foreground">Mes coupons</h2>
            </div>
            <div className="glass rounded-2xl p-6">
              <Suspense fallback={<LoadingSkeleton />}>
                <StudentCouponsList />
              </Suspense>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-100 rounded-full w-1/4" />
      <div className="h-20 bg-gray-100 rounded-xl" />
    </div>
  )
}
