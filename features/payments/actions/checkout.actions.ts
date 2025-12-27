'use server'

/**
 * Checkout Server Actions
 * Initiates Chargily payment flow
 */

import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import { createSupabaseServer } from '@/shared/lib/supabase/server'
import { createOrderCheckout } from '../providers/chargily.provider'
import { OrderCheckoutSchema } from '../schemas/chargily.schema'
import { success, failure, type ActionResult } from '@/shared/types/actions.types'
import { getSiteUrl } from '@/config/env.config'

type CheckoutResult = {
  checkoutUrl: string
}

/**
 * Create checkout session for order
 */
export async function createOrderCheckoutSession(
  orderId: string,
  paymentMethod: 'edahabia' | 'cib'
): Promise<ActionResult<CheckoutResult>> {
  const user = await getCurrentUser()
  if (!user) return failure('Non authentifié')

  // Validate input
  const parsed = OrderCheckoutSchema.safeParse({ orderId, paymentMethod })
  if (!parsed.success) {
    return failure('Données invalides')
  }

  const supabase = await createSupabaseServer()

  // Get order and verify ownership
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('id, buyer_id, total_amount, status, payment_method')
    .eq('id', orderId)
    .eq('buyer_id', user.id)
    .single()

  // Type assertion
  type OrderRow = { id: string; buyer_id: string; total_amount: number; status: string; payment_method: string | null }
  const order = orderData as OrderRow | null

  if (orderError || !order) {
    return failure('Commande non trouvée')
  }

  if (order.status !== 'pending') {
    return failure('Cette commande ne peut plus être payée')
  }

  if (order.payment_method === 'cod') {
    return failure('Cette commande est en paiement à la livraison')
  }

  const siteUrl = getSiteUrl()

  try {
    const { checkoutUrl } = await createOrderCheckout({
      orderId: order.id,
      amount: order.total_amount,
      paymentMethod: parsed.data.paymentMethod,
      description: `Commande RO Line #${order.id.slice(0, 8)}`,
      successUrl: `${siteUrl}/orders/${order.id}?payment=success`,
      failureUrl: `${siteUrl}/orders/${order.id}?payment=failed`,
      webhookUrl: `${siteUrl}/api/webhooks/chargily`,
    })

    // Store checkout info (optional: for tracking)
    await supabase
      .from('orders')
      .update({ payment_method: parsed.data.paymentMethod } as never)
      .eq('id', order.id)

    return success({ checkoutUrl })
  } catch (error) {
    console.error('Checkout creation failed:', error)
    return failure(
      error instanceof Error ? error.message : 'Échec création paiement'
    )
  }
}

/**
 * Get payment status for order
 */
export async function getOrderPaymentStatus(
  orderId: string
): Promise<ActionResult<{ status: string; paidAt: string | null }>> {
  const user = await getCurrentUser()
  if (!user) return failure('Non authentifié')

  const supabase = await createSupabaseServer()

  const { data: orderData, error } = await supabase
    .from('orders')
    .select('status, paid_at')
    .eq('id', orderId)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single()

  // Type assertion
  const order = orderData as { status: string; paid_at: string | null } | null

  if (error || !order) {
    return failure('Commande non trouvée')
  }

  return success({
    status: order.status,
    paidAt: order.paid_at,
  })
}
