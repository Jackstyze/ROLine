/**
 * Order Detail Page
 */

import { notFound } from 'next/navigation'
import { getOrder } from '@/features/orders/actions/orders.actions'
import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import { PayButton } from '@/features/payments/components/PayButton'
import { OrderActions } from './OrderActions'
import Link from 'next/link'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ payment?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  return {
    title: `Commande #${id.slice(0, 8)} | RO Line`,
  }
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Payée', color: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Expédiée', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Livrée', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
}

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const [{ id }, { payment }, user] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
  ])

  const order = await getOrder(id)

  if (!order) {
    notFound()
  }

  const isBuyer = order.buyer_id === user?.id
  const status = statusLabels[order.status]
  const needsPayment =
    isBuyer &&
    order.status === 'pending' &&
    order.payment_method !== 'cod'

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-DZ').format(price)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/orders"
        className="inline-flex items-center text-sm text-green-700 hover:text-green-800 font-medium"
      >
        ← Retour aux commandes
      </Link>

      {/* Payment status messages */}
      {payment === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          Paiement effectué avec succès ! Votre commande va être traitée.
        </div>
      )}
      {payment === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Le paiement a échoué. Veuillez réessayer.
        </div>
      )}

      {/* Order header */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Commande #{order.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-gray-500">{formatDate(order.created_at || '')}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Product info */}
        <div className="flex gap-4 py-4 border-t border-b border-gray-100">
          <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
            {order.product?.images?.[0] ? (
              <img
                src={order.product.images[0]}
                alt={order.product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-gray-400">
                📦
              </div>
            )}
          </div>
          <div>
            <Link
              href={`/marketplace/${order.product_id}`}
              className="font-medium text-foreground hover:text-green-700"
            >
              {order.product?.title || 'Produit'}
            </Link>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatPrice(order.total_amount)} DA
            </p>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Acheteur</p>
            <p className="font-medium text-gray-900">
              {order.buyer?.full_name || 'Anonyme'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Vendeur</p>
            <p className="font-medium text-gray-900">
              {order.seller?.full_name || 'Anonyme'}
            </p>
          </div>
        </div>

        {/* Shipping */}
        <div className="py-4 border-b border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Adresse de livraison
          </p>
          <p className="text-gray-900">{order.shipping_address}</p>
          {order.wilaya && (
            <p className="text-gray-600">
              {order.wilaya.name} - {order.wilaya.name_ar}
            </p>
          )}
        </div>

        {/* Payment method */}
        <div className="py-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Mode de paiement
          </p>
          <p className="text-gray-900">
            {order.payment_method === 'cod' && 'Paiement à la livraison (COD)'}
            {order.payment_method === 'edahabia' && 'Carte EDAHABIA'}
            {order.payment_method === 'cib' && 'Carte CIB'}
          </p>
          {order.paid_at && (
            <p className="text-sm text-green-600">
              Payé le {formatDate(order.paid_at)}
            </p>
          )}
        </div>

        {/* Notes */}
        {order.buyer_notes && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Notes de l&apos;acheteur
            </p>
            <p className="text-gray-700">{order.buyer_notes}</p>
          </div>
        )}
      </div>

      {/* Payment section for buyer */}
      {needsPayment && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">
            Finaliser le paiement
          </h2>
          <PayButton orderId={order.id} amount={order.total_amount} />
        </div>
      )}

      {/* Actions */}
      <OrderActions
        orderId={order.id}
        status={order.status}
        isBuyer={isBuyer}
        isSeller={order.seller_id === user?.id}
      />
    </div>
  )
}
