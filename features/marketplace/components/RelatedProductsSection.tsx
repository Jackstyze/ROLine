import { getRecommendedProducts } from '../actions/recommendations.actions'
import { ProductGrid } from './ProductGrid'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/shared/components/ui/button'

type Props = {
  limit?: number
}

export async function RelatedProductsSection({ limit = 8 }: Props) {
  const products = await getRecommendedProducts(limit)

  if (products.length === 0) {
    return null
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full" />
          <Sparkles className="w-6 h-6 text-yellow-600" />
          <h2 className="text-lg font-bold text-foreground">Pour Vous</h2>
          <span className="text-xs text-muted-foreground">(basé sur votre région et vos achats)</span>
        </div>
        <Button asChild variant="outline" size="sm" className="text-green-700 border-green-600 hover:bg-green-50">
          <Link href="/marketplace">Découvrir plus</Link>
        </Button>
      </div>
      <ProductGrid products={products} />
    </section>
  )
}
