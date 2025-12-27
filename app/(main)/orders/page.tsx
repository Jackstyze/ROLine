/**
 * Orders Page
 */

import { getMyOrders } from '@/features/orders/actions/orders.actions'
import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import Link from 'next/link'

export const metadata = {
  title: 'Mes Commandes | RO Line',
  description: 'Gérez vos commandes sur RO Line',
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Payée', color: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Expédiée', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Livrée', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
}

const paymentLabels: Record<string, string> = {
  cod: 'Paiement à la livraison',
  edahabia: 'Carte EDAHABIA',
  cib: 'Carte CIB',
}

export default async function OrdersPage() {
  const [orders, user] = await Promise.all([getMyOrders(), getCurrentUser()])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-DZ').format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes Commandes</h1>
        <p className="text-gray-600">Suivez vos achats et ventes</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <span className="text-5xl mb-4 block">📦</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune commande
          </h3>
          <p className="text-gray-500 mb-6">
            Vous n&apos;avez pas encore passé de commande.
          </p>
          <Link
            href="/marketplace"
            className="inline-block py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Explorer le marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isBuyer = order.buyer_id === user?.id
            const status = statusLabels[order.status]

            return (
              <div
                key={order.id}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Product image */}
                  <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {order.product?.images?.[0] ? (
                      <img
                        src={order.product.images[0]}
                        alt={order.product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        📦
                      </div>
                    )}
                  </div>

                  {/* Order info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900 truncate">
                          {order.product?.title || 'Produit'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {isBuyer ? 'Vendu par' : 'Acheté par'}{' '}
                          <span className="font-medium">
                            {isBuyer
                              ? order.seller?.full_name
                              : order.buyer?.full_name}
                          </span>
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.created_at || '')} •{' '}
                          {paymentLabels[order.payment_method || 'cod']}
                        </p>
                      </div>

                      <div className="text-end">
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(order.total_amount)} DA
                        </span>
                        <span
                          className={`block mt-1 text-xs px-2 py-1 rounded-full ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {/* Shipping */}
                    {order.wilaya && (
                      <p className="mt-2 text-sm text-gray-500">
                        📍 Livraison: {order.wilaya.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions based on role and status */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                  <Link
                    href={`/orders/${order.id}`}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Voir détails
                  </Link>

                  {/* Buyer needs to pay */}
                  {isBuyer &&
                    order.status === 'pending' &&
                    order.payment_method !== 'cod' && (
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        Payer maintenant
                      </Link>
                    )}

                  {/* Seller can mark as shipped */}
                  {!isBuyer && (order.status === 'pending' || order.status === 'paid') && (
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      Gérer expédition
                    </Link>
                  )}

                  {/* Buyer can confirm delivery */}
                  {isBuyer && order.status === 'shipped' && (
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-sm text-green-600 hover:text-green-700"
                    >
                      Confirmer réception
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
