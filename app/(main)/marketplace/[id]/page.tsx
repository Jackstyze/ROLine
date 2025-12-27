/**
 * Product Detail Page
 */

import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getProduct } from '@/features/marketplace/actions/products.actions'
import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import { ContactSellerButton } from '@/features/marketplace/components/ContactSellerButton'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return { title: 'Produit non trouvé | RO Line' }
  }

  return {
    title: `${product.title} | RO Line`,
    description: product.description || `${product.title} - ${product.price} DA`,
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product, user] = await Promise.all([getProduct(id), getCurrentUser()])

  if (!product) {
    notFound()
  }

  const hasDiscount = product.original_price && product.original_price > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const isOwner = user?.id === product.merchant_id

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center gap-2 text-muted-foreground">
          <li>
            <Link href="/marketplace" className="hover:text-green-700">
              Marketplace
            </Link>
          </li>
          <li>/</li>
          {product.category && (
            <>
              <li>
                <Link
                  href={`/marketplace?category=${product.category.id}`}
                  className="hover:text-green-700"
                >
                  {product.category.name}
                </Link>
              </li>
              <li>/</li>
            </>
          )}
          <li className="text-foreground truncate">{product.title}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          {/* Main image */}
          <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-lg">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[0]}
                alt={product.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}

            {hasDiscount && (
              <span className="absolute top-4 start-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden"
                >
                  <Image
                    src={img}
                    alt={`${product.title} - Image ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            {product.category && (
              <p className="text-sm text-gray-500 mb-1">{product.category.name}</p>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
            {product.title_ar && (
              <p className="text-lg text-gray-600 mt-1" dir="rtl">
                {product.title_ar}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(product.price)} DA
            </span>
            {hasDiscount && (
              <span className="text-xl text-gray-400 line-through">
                {formatPrice(product.original_price!)} DA
              </span>
            )}
          </div>

          {/* Delivery Fee */}
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            {product.delivery_fee && product.delivery_fee > 0 ? (
              <span className="text-gray-600">Livraison: <strong>{formatPrice(product.delivery_fee)} DA</strong></span>
            ) : (
              <span className="text-green-600 font-medium">Livraison gratuite</span>
            )}
          </div>

          {/* Location */}
          {product.wilaya && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>
                {product.wilaya.name} - {product.wilaya.name_ar}
              </span>
            </div>
          )}

          {/* Seller */}
          {product.merchant && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full flex items-center justify-center">
                <span className="text-emerald-700 font-bold text-lg">
                  {product.merchant.full_name?.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {product.merchant.full_name || 'Vendeur'}
                </p>
                <p className="text-sm text-muted-foreground">Vendeur</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {isOwner ? (
              <Link
                href={`/sell?edit=${product.id}`}
                className="block w-full text-center py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Modifier ce produit
              </Link>
            ) : (
              <>
                <ContactSellerButton
                  sellerName={product.merchant?.full_name || 'Vendeur'}
                  sellerPhone={product.merchant?.phone}
                  productTitle={product.title}
                  isLoggedIn={!!user}
                />
                <button
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                  type="button"
                >
                  Acheter maintenant
                </button>
              </>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h2 className="font-medium text-gray-900 mb-2">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-6 text-sm text-gray-500 pt-4 border-t">
            <span>{product.views_count} vues</span>
            <span>
              Publié le{' '}
              {new Date(product.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
