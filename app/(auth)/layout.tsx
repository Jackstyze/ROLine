/**
 * Auth Layout - v0.1
 * Shared layout for login, register, forgot-password pages
 */

import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 algerian-pattern opacity-[0.02]" />

      {/* Decorative blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500 rounded-full opacity-5 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500 rounded-full opacity-5 blur-3xl" />

      {/* Header */}
      <header className="py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-bold">RO</span>
            </div>
            <div>
              <span className="text-xl font-bold text-foreground">Line</span>
              <span className="text-xs text-red-500 ml-1 font-bold">DZ</span>
            </div>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground relative z-10">
        <p>© 2024 RO Line v0.1. Tous droits réservés.</p>
      </footer>
    </div>
  )
}
