import { getFeaturedProducts } from '../actions/recommendations.actions'
import { ProductGrid } from './ProductGrid'
import { Flame } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/shared/components/ui/button'

type Props = {
  limit?: number
}

export async function FeaturedProductsSection({ limit = 8 }: Props) {
  const products = await getFeaturedProducts(limit)

  if (products.length === 0) {
    return null
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-red-400 to-red-600 rounded-full" />
          <Flame className="w-6 h-6 text-red-600" />
          <h2 className="text-lg font-bold text-foreground">Produits en Vedette</h2>
        </div>
        <Button asChild variant="outline" size="sm" className="text-green-700 border-green-600 hover:bg-green-50">
          <Link href="/marketplace">Voir tout</Link>
        </Button>
      </div>
      <ProductGrid products={products} />
    </section>
  )
}
