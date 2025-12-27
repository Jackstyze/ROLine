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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b-4 border-red-500 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-white font-bold">RO</span>
              </div>
              <div>
                <span className="text-xl font-bold text-foreground">Line</span>
                <span className="text-xs text-red-500 ml-1 font-bold">DZ</span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Button asChild variant="ghost" className="text-muted-foreground hover:text-primary">
                <Link href="/marketplace">
                  <Store className="w-4 h-4 mr-2" />
                  Marketplace
                </Link>
              </Button>
              {isMerchant && (
                <Button asChild variant="ghost" className="text-muted-foreground hover:text-primary">
                  <Link href="/sell">
                    <Package className="w-4 h-4 mr-2" />
                    Vendre
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost" className="text-muted-foreground hover:text-primary">
                <Link href="/orders">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Commandes
                </Link>
              </Button>
            </nav>

            {/* User menu */}
            <div className="flex items-center gap-4">
              <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="hidden sm:block text-sm text-right">
                  <p className="font-medium text-foreground">
                    {user.profile?.full_name || user.email?.split('@')[0]}
                  </p>
                  <Badge variant="outline" className="text-xs capitalize">
                    {user.profile?.role || 'student'}
                  </Badge>
                </div>
              </Link>
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500">
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
