'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Flame, ArrowRight } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'

const OFFERS = [
  { icon: '💻', name: 'MacBook Pro M2', price: '185,000', discount: '-15%', hot: true },
  { icon: '📚', name: 'Pack Médecine L1', price: '4,500', discount: '-40%', hot: true },
  { icon: '🎒', name: 'Sac Universitaire', price: '3,500', discount: null, hot: false },
  { icon: '📱', name: 'Calculatrice CASIO', price: '8,500', discount: '-29%', hot: false },
  { icon: '📖', name: 'Physique L2 Pack', price: '6,200', discount: '-25%', hot: true },
  { icon: '🖥️', name: 'Dell Monitor 24"', price: '32,000', discount: '-20%', hot: false },
  { icon: '🎧', name: 'AirPods Pro', price: '28,000', discount: '-15%', hot: true },
  { icon: '📓', name: 'Notes S2 Droit', price: '1,200', discount: null, hot: false },
]

export function HeroCarousel() {
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 4
  const totalPages = Math.ceil(OFFERS.length / itemsPerPage)

  const nextPage = () => setCurrentPage((prev) => (prev + 1) % totalPages)
  const prevPage = () => setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages)

  // Auto-scroll every 2 seconds
  useEffect(() => {
    const interval = setInterval(nextPage, 2000)
    return () => clearInterval(interval)
  }, [])

  const currentOffers = OFFERS.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)

  return (
    <div className="hidden lg:block relative z-20">
      <div className="relative">
        {/* Decorative blurs */}
        <div className="absolute -top-6 -right-6 w-72 h-72 bg-yellow-300 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-6 -left-6 w-72 h-72 bg-red-500 rounded-full opacity-20 blur-3xl" />

        {/* Main glassmorphism card - scale 1.10 (reduced 5%) */}
        <div className="bg-white/65 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border-2 border-white/30 relative" style={{ transform: 'scale(1.10)', transformOrigin: 'center' }}>
          {/* Header - title left, nav buttons CENTER */}
          <div className="flex items-center mb-3">
            <div className="flex items-center gap-2 flex-1">
              <Flame className="w-4 h-4 text-red-600 animate-pulse" />
              <h3 className="text-sm font-bold text-gray-800">Offres du moment</h3>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={prevPage} className="w-6 h-6 rounded-full bg-white shadow hover:bg-gray-50 flex items-center justify-center transition-colors border border-gray-200">
                <ChevronLeft className="w-4 h-4 text-green-700" />
              </button>
              <button onClick={nextPage} className="w-6 h-6 rounded-full bg-green-600 shadow hover:bg-green-700 flex items-center justify-center transition-colors">
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex-1" />
          </div>

          {/* 4 square cards with transition */}
          <div className="grid grid-cols-2 gap-2">
            {currentOffers.map((item, i) => (
              <div key={`${currentPage}-${i}`} className="aspect-square bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group border border-gray-100 hover:border-green-500 flex flex-col animate-fadeIn">
                <div className="flex justify-between items-start">
                  <div className="text-3xl group-hover:scale-110 transition-transform">{item.icon}</div>
                  <div className="flex flex-col gap-0.5">
                    {item.hot && (
                      <Badge className="bg-red-600 text-white border-none text-[8px] px-1 py-0 h-4">
                        <Flame className="w-2 h-2" />
                      </Badge>
                    )}
                    {item.discount && (
                      <Badge className="bg-green-600 text-white border-none text-[8px] px-1 py-0 h-4">
                        {item.discount}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-auto">
                  <p className="font-semibold text-gray-800 truncate text-[11px] leading-tight">{item.name}</p>
                  <p className="text-sm font-bold text-green-700 mt-0.5">{item.price} DA</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer - dots centered, link right */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex-1" />
            <div className="flex gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i)} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentPage ? 'bg-green-600' : 'bg-gray-300'}`} />
              ))}
            </div>
            <div className="flex-1 flex justify-end">
              <Link href="/marketplace" className="text-green-700 hover:text-green-800 transition-colors inline-flex items-center gap-1 text-[10px] font-medium">
                Tout voir <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Floating cards - z-50 to stay on top */}
        <div className="absolute -bottom-12 -left-14 bg-white rounded-xl shadow-xl p-3 animate-float border border-gray-100 z-50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-lg">📚</div>
            <div>
              <div className="text-[10px] text-gray-500">Livre vendu</div>
              <div className="text-xs font-bold text-green-700">+2,500 DA</div>
            </div>
          </div>
        </div>

        <div className="absolute -top-12 -right-14 bg-white rounded-xl shadow-xl p-3 animate-float-delayed border border-gray-100 z-50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center text-lg">🎯</div>
            <div>
              <div className="text-[10px] text-gray-500">Nouvelle offre</div>
              <div className="text-xs font-bold text-red-600">-40% Promo!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
