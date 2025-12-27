/**
 * Main App Layout (authenticated pages)
 */

import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/features/auth/actions/auth.actions'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold text-blue-600">RO Line</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/marketplace"
                className="text-gray-600 hover:text-gray-900"
              >
                Marketplace
              </Link>
              {user.profile?.role === 'merchant' && (
                <Link
                  href="/sell"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Vendre
                </Link>
              )}
              <Link
                href="/orders"
                className="text-gray-600 hover:text-gray-900"
              >
                Commandes
              </Link>
            </nav>

            {/* User menu */}
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  {user.profile?.full_name || user.email}
                </p>
                <p className="text-gray-500 capitalize">
                  {user.profile?.role || 'student'}
                </p>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Déconnexion
                </button>
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
