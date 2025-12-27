import { getLatestProducts } from '../actions/recommendations.actions'
import { ProductGrid } from './ProductGrid'
import { Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/shared/components/ui/button'

type Props = {
  limit?: number
}

export async function LatestProductsSection({ limit = 8 }: Props) {
  const products = await getLatestProducts(limit)

  if (products.length === 0) {
    return null
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-green-400 to-green-600 rounded-full" />
          <Clock className="w-6 h-6 text-green-600" />
          <h2 className="text-lg font-bold text-foreground">Dernières Annonces</h2>
        </div>
        <Button asChild variant="outline" size="sm" className="text-green-700 border-green-600 hover:bg-green-50">
          <Link href="/marketplace">Voir tout</Link>
        </Button>
      </div>
      <ProductGrid products={products} />
    </section>
  )
}
