import Link from 'next/link'
import { Suspense } from 'react'
import { createSupabaseServer } from '@/shared/lib/supabase/server'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { ArrowRight, Sparkles, TrendingUp, Users, ShieldCheck, Truck, MessageCircle, CreditCard } from 'lucide-react'

const CATEGORIES = [
  { id: 1, name: 'Électronique', nameAr: 'إلكترونيات', icon: '💻' },
  { id: 2, name: 'Livres', nameAr: 'كتب', icon: '📚' },
  { id: 3, name: 'Vêtements', nameAr: 'ملابس', icon: '👕' },
  { id: 4, name: 'Services', nameAr: 'خدمات', icon: '🛠️' },
  { id: 5, name: 'Food', nameAr: 'طعام', icon: '🍕' },
  { id: 6, name: 'Sports', nameAr: 'رياضة', icon: '⚽' },
]

const TRUST_SIGNALS = [
  { icon: CreditCard, title: 'Paiement sécurisé', desc: 'Edahabia, CIB, Cash', color: 'emerald' },
  { icon: ShieldCheck, title: 'Vendeurs vérifiés', desc: 'Profils authentifiés', color: 'red' },
  { icon: Truck, title: '69 Wilayas', desc: 'Livraison nationale', color: 'emerald' },
  { icon: MessageCircle, title: 'Support 24/7', desc: 'On est là pour toi', color: 'red' },
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
          <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100">
            <div className="aspect-square bg-gradient-to-br from-emerald-50 via-white to-red-50 flex items-center justify-center">
              <span className="text-5xl">{['💻', '📚', '👕', '📱'][i - 1]}</span>
            </div>
            <div className="p-4 border-t border-gray-100">
              <p className="text-sm text-muted-foreground">Bientôt disponible</p>
              <p className="font-bold text-primary">---.-- DA</p>
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
          className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 hover:border-emerald-200"
        >
          <div className="aspect-square bg-gray-50 relative overflow-hidden">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-emerald-50 to-gray-50">📦</div>
            )}
            {product.original_price && (
              <Badge className="absolute top-3 left-3 bg-red-500 hover:bg-red-600 text-white border-none">
                -{Math.round((1 - product.price / product.original_price) * 100)}%
              </Badge>
            )}
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground truncate">{(product.wilayas as { name: string } | null)?.name}</p>
            <h3 className="font-medium text-foreground truncate">{product.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-bold text-primary">{product.price.toLocaleString()} DA</span>
              {product.original_price && (
                <span className="text-sm text-muted-foreground line-through">{product.original_price.toLocaleString()}</span>
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
      {/* Top Promo Banner */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white text-center py-2.5 text-sm font-medium">
        <span className="animate-pulse mr-2">★</span>
        Livraison gratuite pour ta première commande!
        <span className="animate-pulse ml-2">★</span>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b-4 border-red-500 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-white font-bold">RO</span>
              </div>
              <div>
                <span className="text-xl font-bold text-foreground">Line</span>
                <span className="hidden sm:inline text-xs text-red-500 ml-1 font-bold">DZ</span>
              </div>
            </Link>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 text-foreground placeholder-muted-foreground border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:bg-white transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/marketplace" className="hidden sm:block text-muted-foreground hover:text-primary font-medium text-sm transition-colors">
                Explorer
              </Link>
              <Link href="/login" className="text-muted-foreground hover:text-primary font-medium text-sm transition-colors">
                Connexion
              </Link>
              <Button asChild className="rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/20">
                <Link href="/register">S&apos;inscrire</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Algerian Pattern & Wave Divider */}
      <section className="relative min-h-[650px] lg:min-h-[700px] overflow-hidden">
        {/* Green gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-700">
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
              <Badge className="mb-6 bg-white/20 backdrop-blur-sm text-white border-white/40 px-4 py-2 hover:bg-white/30">
                <Sparkles className="w-4 h-4 mr-2 inline" />
                Paiement Edahabia & CIB
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Marketplace des{' '}
                <span className="relative inline-block text-yellow-300">
                  étudiants
                  <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 200 12" fill="none">
                    <path d="M2 9C60 3 140 3 198 9" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>
                <span className="block text-white/90">algériens</span>
              </h1>

              <p className="text-lg text-emerald-50/90 mb-8 max-w-md">
                Achète et vends entre étudiants. Livres, électronique, vêtements dans les 69 wilayas.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button asChild size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-full shadow-xl hover:shadow-2xl h-14 px-8">
                  <Link href="/marketplace">
                    Explorer maintenant
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 rounded-full h-14 px-8">
                  <Link href="/register?role=merchant">Vendre</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5 text-yellow-300" />
                    <div className="text-3xl font-bold">69</div>
                  </div>
                  <div className="text-emerald-100 text-sm">Wilayas</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-5 h-5 text-yellow-300" />
                    <div className="text-3xl font-bold text-red-300">0%</div>
                  </div>
                  <div className="text-emerald-100 text-sm">Commission</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    <div className="text-3xl font-bold">24/7</div>
                  </div>
                  <div className="text-emerald-100 text-sm">Support</div>
                </div>
              </div>
            </div>

            {/* Right - Floating Cards */}
            <div className="hidden lg:block relative">
              <div className="relative">
                {/* Decorative blurs */}
                <div className="absolute -top-6 -right-6 w-72 h-72 bg-yellow-300 rounded-full opacity-20 blur-3xl" />
                <div className="absolute -bottom-6 -left-6 w-72 h-72 bg-red-500 rounded-full opacity-20 blur-3xl" />

                {/* Main glassmorphism card */}
                <div className="glass rounded-3xl p-8 relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <span className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                      <h3 className="text-xl font-bold text-foreground">Offres du moment</h3>
                    </div>
                    <Link href="/marketplace" className="text-primary font-semibold hover:text-emerald-700 transition-colors flex items-center gap-1">
                      Voir tout <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Product grid inside card */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: '💻', name: 'MacBook Pro M2', price: '185,000', location: 'Alger', discount: '-15%' },
                      { icon: '📚', name: 'Pack Médecine', price: '4,500', location: 'Oran', discount: null },
                      { icon: '👕', name: 'Veste Nike Air', price: '6,000', location: 'Constantine', discount: '-20%' },
                      { icon: '📱', name: 'iPhone 14 Pro', price: '145,000', location: 'Blida', discount: null },
                    ].map((item, i) => (
                      <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 hover:shadow-lg hover:bg-emerald-50/80 transition-all duration-300 cursor-pointer group border border-white/60 hover:border-emerald-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-3xl group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                          {item.discount && (
                            <Badge className="bg-red-500 hover:bg-red-600 text-white border-none text-xs">
                              {item.discount}
                            </Badge>
                          )}
                        </div>
                        <p className="font-semibold text-foreground truncate text-sm mb-1">{item.name}</p>
                        <p className="text-xs text-muted-foreground mb-1">📍 {item.location}</p>
                        <p className="font-bold text-primary">{item.price} DA</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating notification cards */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">📚</span>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Livre vendu</div>
                      <div className="font-bold text-emerald-600">+2,500 DA</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 animate-float-delayed">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Nouvelle offre</div>
                      <div className="font-bold text-red-600">-40% Promo!</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="wave-divider">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRUST_SIGNALS.map((signal, i) => {
              const Icon = signal.icon
              return (
                <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    signal.color === 'emerald'
                      ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600'
                      : 'bg-gradient-to-br from-red-100 to-red-50 text-red-600'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{signal.title}</p>
                    <p className="text-muted-foreground text-xs">{signal.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-10 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full" />
              <div>
                <h2 className="text-2xl font-bold text-foreground">Catégories</h2>
                <p className="text-muted-foreground text-sm">Trouve ce que tu cherches</p>
              </div>
            </div>
            <Button asChild variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <Link href="/marketplace">Voir tout →</Link>
            </Button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-5">
            {CATEGORIES.map((cat, i) => (
              <Link key={cat.id} href={`/marketplace?category=${cat.id}`} className="group text-center">
                <div className={`aspect-square rounded-2xl flex items-center justify-center text-4xl mb-3 transition-all duration-300 ${
                  i % 2 === 0
                    ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 group-hover:from-emerald-100 group-hover:to-emerald-200/50 group-hover:shadow-lg group-hover:shadow-emerald-500/10'
                    : 'bg-gradient-to-br from-red-50 to-red-100/50 group-hover:from-red-100 group-hover:to-red-200/50 group-hover:shadow-lg group-hover:shadow-red-500/10'
                } group-hover:scale-105`}>
                  {cat.icon}
                </div>
                <p className="font-semibold text-foreground text-sm">{cat.name}</p>
                <p className="text-muted-foreground text-xs">{cat.nameAr}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-10 bg-gradient-to-b from-red-400 to-red-600 rounded-full" />
              <div>
                <Badge className="mb-1 bg-red-500 hover:bg-red-600 text-white border-none">NEW</Badge>
                <h2 className="text-2xl font-bold text-foreground">Dernières annonces</h2>
              </div>
            </div>
            <Button asChild className="rounded-full">
              <Link href="/marketplace">Voir tout</Link>
            </Button>
          </div>

          <Suspense fallback={<FeaturedLoading />}>
            <FeaturedProducts />
          </Suspense>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-2">Comment ça marche?</h2>
            <p className="text-muted-foreground">Vendre sur RO Line en 4 étapes</p>
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
                  <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/10">
            <div className="grid md:grid-cols-2">
              <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 p-8 sm:p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 algerian-pattern opacity-20" />
                <div className="relative">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">Rejoins la communauté</h2>
                  <p className="text-emerald-100 mb-6">Des milliers d&apos;étudiants algériens achètent et vendent déjà sur RO Line</p>
                  <Button asChild size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-full">
                    <Link href="/register">Créer mon compte</Link>
                  </Button>
                </div>
              </div>
              <div className="bg-white p-8 sm:p-12 flex flex-col justify-center relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 to-red-600" />
                <div className="text-6xl mb-4 text-red-400">★</div>
                <p className="text-muted-foreground mb-4">Tu as déjà un compte?</p>
                <Button asChild size="lg" className="w-fit rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                  <Link href="/login">Se connecter</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white relative overflow-hidden">
        {/* Algerian Pattern in footer */}
        <div className="absolute inset-0 algerian-pattern opacity-5" />

        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-white to-red-500" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <span className="text-white font-bold">RO</span>
                </div>
                <div>
                  <span className="text-xl font-bold">Line</span>
                  <span className="text-red-400 ml-1 text-xs font-bold">DZ</span>
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
                <div className="bg-emerald-800/50 px-3 py-1.5 rounded-lg text-xs font-medium">Edahabia</div>
                <div className="bg-red-800/50 px-3 py-1.5 rounded-lg text-xs font-medium">CIB</div>
                <div className="bg-gray-800 px-3 py-1.5 rounded-lg text-xs font-medium">Cash</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            <p>© 2024 RO Line v0.1 - Fait avec ❤️ en Algérie 🇩🇿</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
