/**
 * Main App Layout (authenticated pages) - v0.1
 */

import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/features/auth/actions/auth.actions'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Store, ShoppingBag, Package, User, LogOut } from 'lucide-react'
import { PromoBanner } from '@/app/components/PromoBanner'
import { NotificationButton, WishlistButton, CartButton } from '@/shared/components/header'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const isMerchant = user.profile?.role === 'merchant'

  return (
    <div className="min-h-screen bg-background">
      {/* Promo Banner */}
      <PromoBanner />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b-4 border-red-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center">
              <img src="/logos/colored-logo.png" alt="RO Line" className="h-10 w-auto" />
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Button asChild variant="ghost" className="text-muted-foreground hover:text-green-700">
                <Link href="/marketplace">
                  <Store className="w-4 h-4 mr-2" />
                  Marketplace
                </Link>
              </Button>
              {isMerchant && (
                <Button asChild variant="ghost" className="text-muted-foreground hover:text-green-700">
                  <Link href="/sell">
                    <Package className="w-4 h-4 mr-2" />
                    Vendre
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost" className="text-muted-foreground hover:text-green-700">
                <Link href="/orders">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Commandes
                </Link>
              </Button>
            </nav>

            {/* Action Buttons + User menu */}
            <div className="flex items-center gap-2">
              {/* Notification, Wishlist, Cart */}
              <NotificationButton />
              <WishlistButton />
              <CartButton />

              {/* Divider */}
              <div className="hidden sm:block w-px h-8 bg-gray-200 mx-2" />

              {/* User Profile */}
              <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                  <User className="w-5 h-5 text-green-700" />
                </div>
                <div className="hidden sm:block text-sm text-right">
                  <p className="font-medium text-foreground">
                    {user.profile?.full_name || user.email?.split('@')[0]}
                  </p>
                  <Badge variant="outline" className="text-xs capitalize border-green-600 text-green-700">
                    {user.profile?.role || 'student'}
                  </Badge>
                </div>
              </Link>
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="icon" className="text-muted-foreground hover:text-red-600">
                  <LogOut className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
