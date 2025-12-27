/**
 * Merchant Products List
 * Shows merchant's products with management actions
 */

import Image from 'next/image'
import Link from 'next/link'
import { getMerchantProducts } from '../actions/products.actions'
import { PromoteButton } from './PromoteButton'
import { ProductActions } from './ProductActions'

type ProductWithPromotion = Awaited<ReturnType<typeof getMerchantProducts>>[0] & {
  is_promoted?: boolean
  promoted_until?: string | null
  promotion_tier?: string | null
  stock_quantity?: number | null
}

export async function MerchantProductsList() {
  const products = await getMerchantProducts() as ProductWithPromotion[]

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Vous n'avez pas encore de produits</p>
        <Link
          href="/sell"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Publier un produit
        </Link>
      </div>
    )
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-DZ').format(price)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">Actif</span>
      case 'sold':
        return <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">Vendu</span>
      case 'draft':
        return <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">Brouillon</span>
      case 'archived':
        return <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">Archivé</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Mes produits ({products.length})</h2>
        <Link
          href="/sell"
          className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau
        </Link>
      </div>

      <div className="divide-y border rounded-lg bg-white">
        {products.map(product => (
          <div key={product.id} className="p-4 flex gap-4">
            {/* Thumbnail */}
            <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
              {product.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {/* Promotion badge */}
              {product.is_promoted && (
                <div className="absolute top-0 left-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5">
                  PROMU
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/marketplace/${product.id}`}
                  className="font-medium text-gray-900 hover:text-blue-600 truncate"
                >
                  {product.title}
                </Link>
                {getStatusBadge(product.status)}
              </div>

              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="font-medium text-gray-900">{formatPrice(product.price)} DA</span>
                {product.category && <span>{product.category.name}</span>}
                {product.wilaya && <span>{product.wilaya.name}</span>}
              </div>

              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-gray-400">
                  {product.views_count} vues
                </span>
                {product.stock_quantity !== null && product.stock_quantity !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    product.stock_quantity === 0
                      ? 'bg-red-100 text-red-700'
                      : product.stock_quantity <= 5
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {product.stock_quantity === 0 ? 'Rupture' : `${product.stock_quantity} en stock`}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {product.status === 'active' && (
                <PromoteButton
                  productId={product.id}
                  productTitle={product.title}
                  isPromoted={product.is_promoted}
                  promotedUntil={product.promoted_until}
                />
              )}
              <Link
                href={`/sell?edit=${product.id}`}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                title="Modifier"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Link>
              <ProductActions
                productId={product.id}
                productTitle={product.title}
                status={product.status}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
