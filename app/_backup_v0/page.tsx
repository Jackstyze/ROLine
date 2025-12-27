import Link from 'next/link'
import { Suspense } from 'react'
import { createSupabaseServer } from '@/shared/lib/supabase/server'

const CATEGORIES = [
  { id: 1, name: 'Électronique', nameAr: 'إلكترونيات', icon: '💻' },
  { id: 2, name: 'Livres', nameAr: 'كتب', icon: '📚' },
  { id: 3, name: 'Vêtements', nameAr: 'ملابس', icon: '👕' },
  { id: 4, name: 'Services', nameAr: 'خدمات', icon: '🛠️' },
  { id: 5, name: 'Food', nameAr: 'طعام', icon: '🍕' },
  { id: 6, name: 'Sports', nameAr: 'رياضة', icon: '⚽' },
]

const TRUST_SIGNALS = [
  { icon: '🔒', title: 'Paiement sécurisé', desc: 'Edahabia, CIB, Cash' },
  { icon: '✅', title: 'Vendeurs vérifiés', desc: 'Profils authentifiés' },
  { icon: '🚚', title: '69 Wilayas', desc: 'Livraison nationale' },
  { icon: '💬', title: 'Support 24/7', desc: 'On est là pour toi' },
]

type FeaturedProduct = {
  id: string
  title: string
  price: number
  original_price: number | null
  images: string[] | null
  wilayas: { name: string } | null
}

async function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  const supabase = await createSupabaseServer()
  const { data } = await supabase
    .from('products')
    .select(`id, title, price, original_price, images, wilayas (name)`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(4)
  return (data as FeaturedProduct[] | null) || []
}

async function FeaturedProducts() {
  const products = await getFeaturedProducts()

  if (products.length === 0) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/80 backdrop-blur rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
            <div className="aspect-square bg-gradient-to-br from-emerald-50 via-white to-red-50 flex items-center justify-center">
              <span className="text-5xl">{['💻', '📚', '👕', '📱'][i - 1]}</span>
            </div>
            <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-transparent border-t border-emerald-100">
              <p className="text-sm text-gray-500">Bientôt disponible</p>
              <p className="font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">---.-- DA</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/marketplace/${product.id}`}
          className="bg-white/80 backdrop-blur rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-emerald-50 to-gray-50">📦</div>
            )}
            {product.original_price && (
              <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                -{Math.round((1 - product.price / product.original_price) * 100)}%
              </div>
            )}
          </div>
          <div className="p-4 bg-gradient-to-r from-emerald-500/5 to-transparent">
            <p className="text-sm text-gray-500 truncate">{(product.wilayas as { name: string } | null)?.name}</p>
            <h3 className="font-medium text-gray-900 truncate">{product.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">{product.price.toLocaleString()} DA</span>
              {product.original_price && (
                <span className="text-sm text-gray-400 line-through">{product.original_price.toLocaleString()}</span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function FeaturedLoading() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white/80 backdrop-blur rounded-2xl overflow-hidden animate-pulse">
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Top banner - Gradient red */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white text-center py-2.5 text-sm font-medium">
        <span className="animate-pulse mr-2">★</span>
        Livraison gratuite pour ta première commande!
        <span className="animate-pulse ml-2">★</span>
      </div>

      {/* Navigation - with gradient border */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-white font-bold">RO</span>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Line</span>
                <span className="hidden sm:inline text-xs bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent ml-1 font-bold">DZ</span>
              </div>
            </Link>

            {/* Search bar - FIXED: visible background */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 text-gray-900 placeholder-gray-500 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:bg-white transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/marketplace" className="hidden sm:block text-gray-600 hover:text-emerald-600 font-medium text-sm transition-colors">
                Explorer
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-emerald-600 font-medium text-sm transition-colors">
                Connexion
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-500/20"
              >
                S&apos;inscrire
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full width green with glassmorphism */}
      <section className="relative min-h-[600px] lg:min-h-[700px]">
        {/* Full width green gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-700">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(220,38,38,0.1),transparent_40%)]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="grid lg:grid-cols-2 gap-8 items-center py-12 lg:py-16">
            {/* Left content */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-lg shadow-red-500/30">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Paiement Edahabia & CIB
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-bold mb-5 leading-tight">
                Marketplace
                <span className="block text-white/90">des étudiants</span>
                <span className="bg-gradient-to-r from-red-300 to-red-400 bg-clip-text text-transparent">algériens</span>
              </h1>

              <p className="text-base text-emerald-50/90 mb-6 max-w-md">
                Achète et vends entre étudiants. Livres, électronique, vêtements dans les 69 wilayas.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/marketplace"
                  className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 px-5 py-3 rounded-xl font-bold hover:shadow-xl hover:shadow-white/20 transition-all"
                >
                  Explorer <span className="text-red-500">→</span>
                </Link>
                <Link
                  href="/register?role=merchant"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-3 rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/30"
                >
                  Vendre
                </Link>
              </div>

              <div className="flex gap-8 mt-8 pt-6 border-t border-white/20">
                <div className="text-center">
                  <div className="text-2xl font-bold">69</div>
                  <div className="text-emerald-100/70 text-xs">Wilayas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-red-300 to-red-400 bg-clip-text text-transparent">0%</div>
                  <div className="text-emerald-100/70 text-xs">Commission</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-emerald-100/70 text-xs">Support</div>
                </div>
              </div>
            </div>

            {/* Right - Featured banner LARGE with glassmorphism */}
            <div className="hidden lg:block">
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-black/20 border border-white/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-pulse" />
                    <h3 className="text-xl font-bold text-gray-900">Offres du moment</h3>
                  </div>
                  <Link href="/marketplace" className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors flex items-center gap-1">
                    Voir tout <span>→</span>
                  </Link>
                </div>

                {/* Large product grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: '💻', name: 'MacBook Pro M2', price: '185,000', location: 'Alger', discount: '-15%' },
                    { icon: '📚', name: 'Pack Médecine 3ème année', price: '4,500', location: 'Oran', discount: null },
                    { icon: '👕', name: 'Veste Nike Air', price: '6,000', location: 'Constantine', discount: '-20%' },
                    { icon: '📱', name: 'iPhone 14 Pro', price: '145,000', location: 'Blida', discount: null },
                    { icon: '🎧', name: 'AirPods Pro', price: '25,000', location: 'Sétif', discount: '-10%' },
                    { icon: '📷', name: 'Canon EOS R6', price: '280,000', location: 'Annaba', discount: null },
                  ].map((item, i) => (
                    <Link
                      key={i}
                      href="/marketplace"
                      className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 hover:shadow-lg hover:bg-emerald-50/80 transition-all duration-300 cursor-pointer group border border-white/60 hover:border-emerald-200"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-4xl group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                        {item.discount && (
                          <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {item.discount}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 truncate mb-1">{item.name}</p>
                      <p className="text-xs text-gray-400 mb-2">📍 {item.location}</p>
                      <p className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                        {item.price} DA
                      </p>
                    </Link>
                  ))}
                </div>

                {/* Bottom CTA */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <Link
                    href="/marketplace"
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Explorer le marketplace <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRUST_SIGNALS.map((signal, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-white/80 backdrop-blur shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  i % 2 === 0
                    ? 'bg-gradient-to-br from-emerald-100 to-emerald-50'
                    : 'bg-gradient-to-br from-red-100 to-red-50'
                }`}>
                  {signal.icon}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{signal.title}</p>
                  <p className="text-gray-500 text-xs">{signal.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-10 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Catégories</h2>
                <p className="text-gray-500 text-sm">Trouve ce que tu cherches</p>
              </div>
            </div>
            <Link href="/marketplace" className="text-red-500 font-semibold text-sm hover:text-red-600 transition-colors">
              Voir tout →
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-5">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/marketplace?category=${cat.id}`}
                className="group text-center"
              >
                <div className={`aspect-square rounded-2xl flex items-center justify-center text-4xl mb-3 transition-all duration-300 ${
                  i % 2 === 0
                    ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 group-hover:from-emerald-100 group-hover:to-emerald-200/50 group-hover:shadow-lg group-hover:shadow-emerald-500/10'
                    : 'bg-gradient-to-br from-red-50 to-red-100/50 group-hover:from-red-100 group-hover:to-red-200/50 group-hover:shadow-lg group-hover:shadow-red-500/10'
                } group-hover:scale-105`}>
                  {cat.icon}
                </div>
                <p className="font-semibold text-gray-900 text-sm">{cat.name}</p>
                <p className="text-gray-400 text-xs">{cat.nameAr}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-10 bg-gradient-to-b from-red-400 to-red-600 rounded-full" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">NEW</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Dernières annonces</h2>
              </div>
            </div>
            <Link
              href="/marketplace"
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
            >
              Voir tout
            </Link>
          </div>

          <Suspense fallback={<FeaturedLoading />}>
            <FeaturedProducts />
          </Suspense>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Comment ça marche?</h2>
            <p className="text-gray-500">Vendre sur RO Line en 4 étapes</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', icon: '📝', title: 'Inscris-toi', desc: 'Compte gratuit', color: 'emerald' },
              { step: '02', icon: '📸', title: 'Publie', desc: 'Photos + description', color: 'red' },
              { step: '03', icon: '💬', title: 'Échange', desc: 'Chat avec acheteurs', color: 'emerald' },
              { step: '04', icon: '✅', title: 'Vends', desc: 'Reçois ton argent', color: 'red' },
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 3 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-gray-200 to-transparent" />
                )}
                <div className={`rounded-2xl p-6 transition-all hover:shadow-lg ${
                  item.color === 'emerald'
                    ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/30 hover:shadow-emerald-500/10'
                    : 'bg-gradient-to-br from-red-50 to-red-100/30 hover:shadow-red-500/10'
                }`}>
                  <div className={`text-4xl font-black mb-3 ${item.color === 'emerald' ? 'text-emerald-200' : 'text-red-200'}`}>{item.step}</div>
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Smooth gradient */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/10">
            <div className="grid md:grid-cols-2">
              <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 p-8 sm:p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
                <div className="relative">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">Rejoins la communauté</h2>
                  <p className="text-emerald-100 mb-6">Des milliers d&apos;étudiants algériens achètent et vendent déjà sur RO Line</p>
                  <Link
                    href="/register"
                    className="inline-block bg-white text-emerald-700 px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all"
                  >
                    Créer mon compte
                  </Link>
                </div>
              </div>
              <div className="bg-gradient-to-br from-white to-gray-50 p-8 sm:p-12 flex flex-col justify-center relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 to-red-600" />
                <div className="text-6xl mb-4 text-red-400">★</div>
                <p className="text-gray-600 mb-4">Tu as déjà un compte?</p>
                <Link
                  href="/login"
                  className="inline-block bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 rounded-xl font-bold transition-all w-fit shadow-lg shadow-red-500/20"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-white to-red-500" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <span className="text-white font-bold">RO</span>
                </div>
                <div>
                  <span className="text-xl font-bold">Line</span>
                  <span className="bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent ml-1 text-xs font-bold">DZ</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm">Le marketplace des étudiants algériens.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-emerald-400">Marketplace</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/marketplace" className="hover:text-white transition-colors">Tous les produits</Link></li>
                <li><Link href="/marketplace?category=1" className="hover:text-white transition-colors">Électronique</Link></li>
                <li><Link href="/marketplace?category=2" className="hover:text-white transition-colors">Livres</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-red-400">Compte</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/register" className="hover:text-white transition-colors">S&apos;inscrire</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Se connecter</Link></li>
                <li><Link href="/sell" className="hover:text-white transition-colors">Vendre</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Paiements</h4>
              <div className="flex flex-wrap gap-2">
                <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 px-3 py-1.5 rounded-lg text-xs font-medium">Edahabia</div>
                <div className="bg-gradient-to-r from-red-800 to-red-900 px-3 py-1.5 rounded-lg text-xs font-medium">CIB</div>
                <div className="bg-gray-800 px-3 py-1.5 rounded-lg text-xs font-medium">Cash</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            <p>© 2024 RO Line. Fait avec ❤️ en Algérie 🇩🇿</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
