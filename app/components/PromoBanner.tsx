'use client'

import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

export function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-red-600 via-green-700 to-red-600 text-white py-3 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] opacity-30" />

      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 relative z-10">
        <Sparkles className="w-5 h-5 animate-pulse" />
        <p className="text-center text-sm">
          <span className="hidden sm:inline">🎉 </span>
          <strong>Ramadan Kareem!</strong> Réduction de <strong>20%</strong> sur tous les livres avec le code{' '}
          <strong className="bg-white/20 px-2 py-0.5 rounded">RAMADAN24</strong>
          <span className="hidden sm:inline"> 🎉</span>
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 h-8 w-8 text-white hover:bg-white/20"
          onClick={() => setIsVisible(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
