import Link from 'next/link'
import { Suspense } from 'react'
import { createSupabaseServer } from '@/shared/lib/supabase/server'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { ArrowRight, Sparkles, TrendingUp, Users, ShieldCheck, Truck, MessageCircle, CreditCard, Search, Star, Flame } from 'lucide-react'
import { PromoBanner } from './components/PromoBanner'
import { HeroCarousel } from './components/HeroCarousel'

const CATEGORIES = [
  { id: 1, name: 'Électronique', nameAr: 'إلكترونيات', icon: '💻' },
  { id: 2, name: 'Livres', nameAr: 'كتب', icon: '📚' },
  { id: 3, name: 'Vêtements', nameAr: 'ملابس', icon: '👕' },
  { id: 4, name: 'Services', nameAr: 'خدمات', icon: '🛠️' },
  { id: 5, name: 'Food', nameAr: 'طعام', icon: '🍕' },
  { id: 6, name: 'Sports', nameAr: 'رياضة', icon: '⚽' },
]

const TRUST_SIGNALS = [
  { icon: ShieldCheck, title: 'Paiement Sécurisé', desc: 'Transactions 100% protégées', color: 'green' },
  { icon: Truck, title: 'Livraison Rapide', desc: 'Partout en Algérie', color: 'green' },
  { icon: CreditCard, title: 'Paiement Flexible', desc: 'CCP, Baridimob, Espèces', color: 'green' },
  { icon: MessageCircle, title: 'Support 24/7', desc: 'Service client réactif', color: 'green' },
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
            <div className="aspect-square bg-gradient-to-br from-green-50 to-gray-50 flex items-center justify-center relative">
              <span className="text-6xl">{['💻', '📚', '👕', '📱'][i - 1]}</span>
            </div>
            <div className="p-4">
              <h4 className="font-medium text-gray-800 mb-2">Bientôt disponible</h4>
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-gray-300" />
                ))}
              </div>
              <p className="text-2xl font-bold text-green-700">---.-- DA</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/marketplace/${product.id}`}
          className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
        >
          {/* Image */}
          <div className="aspect-square bg-gray-100 relative overflow-hidden">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-green-50 to-gray-50">📦</div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
              <div className="flex gap-2">
                {product.original_price && (
                  <Badge className="bg-green-600 text-white border-none shadow-lg">
                    -{Math.round((1 - product.price / product.original_price) * 100)}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick view overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-green-700/95 via-green-700/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
              <Button className="bg-white text-green-700 hover:bg-green-50 w-full rounded-xl">
                Voir Détails
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h4 className="line-clamp-2 mb-2 text-gray-800 min-h-[3rem] font-medium">
              {product.title}
            </h4>

            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              ))}
              <span className="text-sm text-gray-600">(4.5)</span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold text-green-700">{product.price.toLocaleString()} DA</span>
              {product.original_price && (
                <span className="text-sm text-gray-400 line-through">{product.original_price.toLocaleString()}</span>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 text-sm text-gray-600">
              📍 {(product.wilayas as { name: string } | null)?.name || 'Algérie'}
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
        <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse border border-gray-100">
          <div className="aspect-square bg-gray-100" />
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
    <div className="min-h-screen bg-background">
      {/* Top Promo Banner - Figma Style with close button */}
      <PromoBanner />

      {/* Navigation - Figma Style */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b-4 border-red-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <img src="/logos/colored-logo.png" alt="RO Line" className="h-10 w-auto" />
            </Link>

            {/* Search Bar - Figma Style */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Chercher des livres, cours, matériel..."
                  className="w-full pl-12 pr-4 py-3 bg-white text-foreground placeholder-gray-400 border-2 border-green-600/30 rounded-full text-sm focus:outline-none focus:border-green-600 shadow-sm transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/marketplace" className="hidden sm:block text-gray-600 hover:text-green-700 font-medium text-sm transition-colors">
                Explorer
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-green-700 font-medium text-sm transition-colors">
                Connexion
              </Link>
              <Button asChild className="rounded-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg">
                <Link href="/register">S&apos;inscrire</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Figma Style */}
      <section className="relative min-h-[700px] lg:min-h-[780px] overflow-hidden">
        {/* Green gradient background - Figma colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-green-700 to-green-800">
          {/* Algerian Pattern Overlay */}
          <div className="absolute inset-0 algerian-pattern opacity-30" />
          {/* Radial gradients */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(220,38,38,0.1),transparent_40%)]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-white">
              <div className="mb-6 flex justify-center -ml-[10%] -mt-[20%]">
                <img src="/logos/transparent-logo.png" alt="RO Line" className="h-96 sm:h-[28rem] lg:h-[32rem] w-auto drop-shadow-lg" />
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8 text-center -ml-[10%] -mt-[20%]">
                Le marketplace{' '}
                <span className="text-yellow-300 relative inline-block">
                  DZtudiants
                  <svg className="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 200 12" fill="none">
                    <path d="M2 9C60 3 140 3 198 9" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>
              </h1>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button asChild size="lg" className="bg-white text-green-700 hover:bg-green-50 rounded-full shadow-xl hover:shadow-2xl h-14 px-8 text-lg">
                  <Link href="/marketplace">
                    Commencer maintenant
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 rounded-full h-14 px-8 text-lg">
                  <Link href="/register?role=merchant">Comment ça marche?</Link>
                </Button>
              </div>

              {/* Stats - Figma Style */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5 text-yellow-300" />
                    <div className="text-3xl font-bold">50K+</div>
                  </div>
                  <div className="text-green-100 text-sm">Étudiants actifs</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-5 h-5 text-yellow-300" />
                    <div className="text-3xl font-bold">200K+</div>
                  </div>
                  <div className="text-green-100 text-sm">Produits vendus</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    <div className="text-3xl font-bold">4.9/5</div>
                  </div>
                  <div className="text-green-100 text-sm">Satisfaction</div>
                </div>
              </div>
            </div>

            {/* Right - Offers Carousel - Interactive Client Component */}
            <HeroCarousel />
          </div>
        </div>

        {/* Wave Divider */}
        <div className="wave-divider">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Trust Signals - Figma Style */}
      <section className="py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST_SIGNALS.map((signal, i) => {
              const Icon = signal.icon
              return (
                <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-green-50 transition-colors group">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-green-700" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{signal.title}</h3>
                  <p className="text-sm text-gray-600">{signal.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Categories - Figma Style */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-gray-800 mb-3">Explorer par Catégorie</h2>
            <p className="text-xl text-gray-600">Trouve exactement ce que tu cherches</p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 md:gap-6">
            {CATEGORIES.map((cat, i) => (
              <Link key={cat.id} href={`/marketplace?category=${cat.id}`} className="group text-center">
                <div className={`aspect-square rounded-2xl flex items-center justify-center text-4xl mb-3 transition-all duration-300 border-2 border-transparent group-hover:border-green-600 group-hover:shadow-2xl ${
                  i % 2 === 0
                    ? 'bg-gradient-to-br from-green-500 to-green-600'
                    : 'bg-gradient-to-br from-red-500 to-red-600'
                } group-hover:scale-110`}>
                  <span className="filter drop-shadow-lg">{cat.icon}</span>
                </div>
                <p className="font-semibold text-gray-800 group-hover:text-green-700 transition-colors">{cat.name}</p>
                <p className="text-gray-500 text-xs">{cat.nameAr}</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-6">
            <Button asChild variant="outline" className="border-2 border-green-600 text-green-700 hover:bg-green-600 hover:text-white rounded-full px-8">
              <Link href="/marketplace">Voir toutes les catégories</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products - Figma Style */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <Flame className="w-10 h-10 text-red-600" />
                Produits en Vedette
              </h2>
              <p className="text-xl text-gray-600">Les meilleures offres du moment</p>
            </div>
            <Button asChild variant="outline" className="border-2 border-green-600 text-green-700 hover:bg-green-600 hover:text-white rounded-full hidden md:flex">
              <Link href="/marketplace">Voir tout</Link>
            </Button>
          </div>

          <Suspense fallback={<FeaturedLoading />}>
            <FeaturedProducts />
          </Suspense>
        </div>
      </section>

      {/* How it Works - Figma Style */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-gray-800 mb-3">Comment ça marche?</h2>
            <p className="text-xl text-gray-600">Vendre sur RO Line en 4 étapes simples</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', icon: '📝', title: 'Inscris-toi', desc: 'Compte gratuit en 30 sec', color: 'green' },
              { step: '02', icon: '📸', title: 'Publie', desc: 'Photos + description', color: 'red' },
              { step: '03', icon: '💬', title: 'Échange', desc: 'Chat avec acheteurs', color: 'green' },
              { step: '04', icon: '✅', title: 'Vends', desc: 'Reçois ton argent', color: 'red' },
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 3 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-gray-300 to-transparent" />
                )}
                <div className={`rounded-2xl p-6 transition-all hover:shadow-xl hover:-translate-y-1 ${
                  item.color === 'green'
                    ? 'bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-green-500/20'
                    : 'bg-gradient-to-br from-red-50 to-red-100/50 hover:shadow-red-500/20'
                }`}>
                  <div className={`text-5xl font-black mb-3 ${item.color === 'green' ? 'text-green-200' : 'text-red-200'}`}>{item.step}</div>
                  <div className="text-5xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-gray-800 text-lg mb-1">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Full Figma Design (reduced height) */}
      <section className="py-12 bg-gradient-to-br from-green-600 via-green-700 to-red-600 relative overflow-hidden">
        {/* Decorative patterns */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full">
            <defs>
              <pattern id="ctaPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 30 10 L 40 20 L 50 10 L 50 20 L 40 30 L 50 40 L 50 50 L 40 40 L 30 50 L 20 40 L 10 50 L 10 40 L 20 30 L 10 20 L 10 10 L 20 20 Z" fill="white" />
                <circle cx="30" cy="30" r="3" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ctaPattern)" />
          </svg>
        </div>

        {/* Animated circles */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-yellow-300 rounded-full opacity-20 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-red-400 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-5 h-5" />
              <span>Rejoins la communauté</span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Prêt à commencer ton aventure?
            </h2>

            <p className="text-lg md:text-xl mb-6 text-green-50">
              Inscris-toi maintenant et profite de <strong className="text-yellow-300">20% de réduction</strong> sur ta première commande!
            </p>

            {/* Email signup form */}
            <div className="max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4 bg-white rounded-full p-2 shadow-2xl">
                <input
                  type="email"
                  placeholder="Ton adresse email..."
                  className="flex-1 h-14 border-0 bg-transparent text-gray-800 placeholder:text-gray-500 focus:outline-none text-lg px-6"
                />
                <Button asChild size="lg" className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white h-14 px-8 rounded-full shadow-lg">
                  <Link href="/register">
                    Commencer
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              </div>

              <p className="text-sm text-green-100 mt-4">
                En t&apos;inscrivant, tu acceptes nos conditions d&apos;utilisation et notre politique de confidentialité
              </p>
            </div>

            {/* Social proof */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-green-50">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">👨‍🎓</div>
                  <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">👩‍🎓</div>
                  <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">👨‍💼</div>
                </div>
                <span>+50K étudiants inscrits</span>
              </div>
              <div className="hidden md:block w-px h-8 bg-white/30" />
              <div>⭐⭐⭐⭐⭐ 4.9/5 sur 2,000+ avis</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Figma Style */}
      <footer className="bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 text-white pt-16 pb-8 relative overflow-hidden">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full">
            <defs>
              <pattern id="footerPattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 25 10 L 35 20 L 40 10 L 40 20 L 35 25 L 40 30 L 40 40 L 35 30 L 25 40 L 15 30 L 10 40 L 10 30 L 15 25 L 10 20 L 10 10 L 15 20 Z" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#footerPattern)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* About */}
            <div>
              <div className="mb-4">
                <img src="/logos/transparent-logo.png" alt="RO Line" className="h-12 w-auto" />
              </div>
              <p className="text-gray-300 mb-6">
                La première plateforme de marketplace dédiée aux étudiants algériens. Achète, vends et échange en toute sécurité.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">📱</a>
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">📷</a>
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">🐦</a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xl font-bold mb-4 text-white">Liens Rapides</h4>
              <ul className="space-y-3 text-gray-300">
                <li><Link href="#" className="hover:text-green-400 transition-colors">À propos</Link></li>
                <li><Link href="#" className="hover:text-green-400 transition-colors">Comment ça marche</Link></li>
                <li><Link href="#" className="hover:text-green-400 transition-colors">Nos services</Link></li>
                <li><Link href="#" className="hover:text-green-400 transition-colors">Blog</Link></li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-xl font-bold mb-4 text-white">Catégories</h4>
              <ul className="space-y-3 text-gray-300">
                <li><Link href="/marketplace?category=2" className="hover:text-green-400 transition-colors">Livres & Manuels</Link></li>
                <li><Link href="/marketplace?category=1" className="hover:text-green-400 transition-colors">Électronique</Link></li>
                <li><Link href="/marketplace" className="hover:text-green-400 transition-colors">Informatique</Link></li>
                <li><Link href="/marketplace" className="hover:text-green-400 transition-colors">Fournitures</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xl font-bold mb-4 text-white">Contact</h4>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-green-400">📍</span>
                  <span>Alger Centre, Algérie</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-400">📞</span>
                  <span>+213 555 123 456</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-400">✉️</span>
                  <span>contact@roline.dz</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-sm">
              <p>© 2025 RO Line v0.1. Tous droits réservés. 🇩🇿</p>
              <div className="flex gap-6">
                <Link href="#" className="hover:text-green-400 transition-colors">Conditions d&apos;utilisation</Link>
                <Link href="#" className="hover:text-green-400 transition-colors">Politique de confidentialité</Link>
                <Link href="#" className="hover:text-green-400 transition-colors">Aide & Support</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
