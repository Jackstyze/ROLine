'use server'

/**
 * Order Server Actions
 *
 * CRITICAL FIXES:
 * - Uses shared ActionResult types (DRY)
 * - Marks product as 'sold' when order is delivered
 * - Transaction-safe order creation
 */

import { createSupabaseServer } from '@/shared/lib/supabase/server'
import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import { revalidatePath } from 'next/cache'
import { OrderCreateSchema } from '../schemas/order.schema'
import { success, failure, type ActionResult } from '@/shared/types/actions.types'
import type { Tables, Insertable, Updatable } from '@/shared/types/database.types'
import { validateCoupon, applyCouponToOrder } from '@/features/coupons/actions/coupons.actions'
import type { ValidationResult, ValidateCouponResult } from '@/features/coupons/types/coupon.types'

// Order types
type OrderInsert = Insertable<'orders'>
type OrderUpdate = Updatable<'orders'>

// Use database types for consistency
export type Order = Tables<'orders'> & {
  product?: Pick<Tables<'products'>, 'id' | 'title' | 'images' | 'price'>
  buyer?: Pick<Tables<'profiles'>, 'id' | 'full_name'>
  seller?: Pick<Tables<'profiles'>, 'id' | 'full_name'>
  wilaya?: Pick<Tables<'wilayas'>, 'id' | 'name' | 'name_ar'>
}

/**
 * Get user's orders (as buyer or seller)
 */
export async function getMyOrders(): Promise<Order[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const supabase = await createSupabaseServer()

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      product:products(id, title, images, price),
      buyer:profiles!buyer_id(id, full_name),
      seller:profiles!seller_id(id, full_name),
      wilaya:wilayas!shipping_wilaya(id, name, name_ar)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch orders: ${error.message}`)

  return (data as Order[]) ?? []
}

/**
 * Get single order
 */
export async function getOrder(orderId: string): Promise<Order | null> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const supabase = await createSupabaseServer()

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      product:products(id, title, images, price),
      buyer:profiles!buyer_id(id, full_name),
      seller:profiles!seller_id(id, full_name),
      wilaya:wilayas!shipping_wilaya(id, name, name_ar)
    `)
    .eq('id', orderId)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch order: ${error.message}`)
  }

  return data as Order
}

/**
 * Create a new order (ATOMIC)
 *
 * Uses database function to atomically:
 * 1. Lock the product row
 * 2. Verify availability
 * 3. Reserve the product
 * 4. Create the order
 *
 * This prevents race conditions where multiple users order the same product.
 */
export async function createOrder(
  _prevState: ActionResult<Order> | null,
  formData: FormData
): Promise<ActionResult<Order>> {
  const user = await getCurrentUser()
  if (!user) return failure('Non authentifié')

  const rawInput = {
    productId: formData.get('productId') as string,
    paymentMethod: formData.get('paymentMethod') as 'cod' | 'edahabia' | 'cib',
    shippingAddress: formData.get('shippingAddress') as string,
    shippingWilaya: Number(formData.get('shippingWilaya')),
    notes: (formData.get('notes') as string) || undefined,
    couponCode: (formData.get('couponCode') as string) || undefined,
  }

  const parsed = OrderCreateSchema.safeParse(rawInput)
  if (!parsed.success) {
    return failure(
      'Validation échouée',
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }

  const supabase = await createSupabaseServer()

  // Validate coupon if provided
  let couponValidation: ValidationResult | null = null
  if (parsed.data.couponCode) {
    // Get product price for context
    const { data: productData } = await supabase
      .from('products')
      .select('price, category_id, wilaya_id')
      .eq('id', parsed.data.productId)
      .single()

    type ProductPrice = { price: number; category_id: number | null; wilaya_id: number }
    const product = productData as ProductPrice | null
    if (product) {
      const couponResult = await validateCoupon(parsed.data.couponCode, {
        type: 'product',
        targetId: parsed.data.productId,
        amount: product.price,
        wilaya: product.wilaya_id,
        categoryId: product.category_id ?? undefined,
      })

      if ('error' in couponResult) {
        return failure(couponResult.error)
      }
      couponValidation = couponResult
    }
  }

  // Use atomic function to prevent race conditions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error: rpcError } = await (supabase.rpc as any)(
    'create_order_atomic',
    {
      p_buyer_id: user.id,
      p_product_id: parsed.data.productId,
      p_payment_method: parsed.data.paymentMethod,
      p_shipping_address: parsed.data.shippingAddress,
      p_shipping_wilaya: parsed.data.shippingWilaya,
      p_buyer_notes: parsed.data.notes || null,
    }
  )

  if (rpcError) {
    return failure(`Échec création commande: ${rpcError.message}`)
  }

  // Parse RPC result
  const rpcResult = result as { success: boolean; error?: string; order_id?: string }

  if (!rpcResult.success || !rpcResult.order_id) {
    return failure(rpcResult.error || 'Échec création commande')
  }

  const orderId = rpcResult.order_id

  // Apply coupon if validated
  if (couponValidation) {
    // Update order with coupon and discount
    await supabase
      .from('orders')
      .update({
        coupon_id: couponValidation.couponId,
        discount_amount: couponValidation.discountAmount,
      } as never)
      .eq('id', orderId)

    // Record coupon usage
    await applyCouponToOrder(
      couponValidation.couponId,
      orderId,
      {
        type: 'product',
        targetId: parsed.data.productId,
        amount: couponValidation.discountAmount,
      },
      couponValidation.discountAmount
    )
  }

  // Fetch the complete order
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select(`
      *,
      product:products(id, title, images, price),
      buyer:profiles!buyer_id(id, full_name),
      seller:profiles!seller_id(id, full_name),
      wilaya:wilayas!shipping_wilaya(id, name, name_ar)
    `)
    .eq('id', orderId)
    .single()

  if (fetchError) {
    // Order was created but fetch failed - still success
    revalidatePath('/orders')
    revalidatePath('/marketplace')
    return success({ id: orderId } as Order)
  }

  revalidatePath('/orders')
  revalidatePath('/marketplace')

  return success(order as Order)
}

/**
 * Update order status
 *
 * CRITICAL: When order is 'delivered':
 * - Mark product as 'sold'
 * - Prevent future orders on this product
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: 'shipped' | 'delivered' | 'cancelled'
): Promise<ActionResult<void>> {
  const user = await getCurrentUser()
  if (!user) return failure('Non authentifié')

  const supabase = await createSupabaseServer()

  // Get order with product info
  const { data: orderData, error: fetchError } = await supabase
    .from('orders')
    .select('id, buyer_id, seller_id, product_id, status')
    .eq('id', orderId)
    .single()

  // Type assertion
  type OrderRow = { id: string; buyer_id: string; seller_id: string; product_id: string; status: string }
  const order = orderData as OrderRow | null

  if (fetchError || !order) {
    return failure('Commande non trouvée')
  }

  // Validate permissions
  const isBuyer = order.buyer_id === user.id
  const isSeller = order.seller_id === user.id

  if (newStatus === 'shipped' && !isSeller) {
    return failure('Seul le vendeur peut marquer comme expédié')
  }

  if (newStatus === 'delivered' && !isBuyer) {
    return failure("Seul l'acheteur peut confirmer la livraison")
  }

  if (newStatus === 'cancelled') {
    // Only pending orders can be cancelled
    if (order.status !== 'pending') {
      return failure('Seules les commandes en attente peuvent être annulées')
    }
    if (!isBuyer && !isSeller) {
      return failure('Non autorisé')
    }
  }

  // Build update data
  const updateData: OrderUpdate = { status: newStatus }
  const now = new Date().toISOString()

  if (newStatus === 'shipped') updateData.shipped_at = now
  if (newStatus === 'delivered') updateData.delivered_at = now
  if (newStatus === 'cancelled') updateData.cancelled_at = now

  // Update order
  const { error: updateError } = await supabase
    .from('orders')
    .update(updateData as never)
    .eq('id', orderId)

  if (updateError) {
    return failure(`Échec mise à jour: ${updateError.message}`)
  }

  // CRITICAL: Mark product as 'sold' when delivered
  if (newStatus === 'delivered') {
    const { error: productError } = await supabase
      .from('products')
      .update({ status: 'sold' } as never)
      .eq('id', order.product_id)

    if (productError) {
      // Log but don't fail - order was updated
      console.error('Failed to mark product as sold:', productError.message)
    }
  }

  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/marketplace')
  revalidatePath(`/marketplace/${order.product_id}`)

  return success(undefined)
}

/**
 * Mark order as paid (INTERNAL - called only from verified webhook)
 *
 * SECURITY: This function requires a webhook secret to prevent
 * unauthorized calls. The secret is verified in the webhook handler
 * before this function is called.
 *
 * @internal Only call from verified webhook handlers
 */
export async function markOrderAsPaid(
  orderId: string,
  paymentId: string,
  webhookSecret: string
): Promise<ActionResult<void>> {
  // Verify webhook secret matches configured secret
  const configuredSecret = process.env.CHARGILY_SECRET_KEY
  if (!configuredSecret || webhookSecret !== configuredSecret) {
    console.error(`Security: Unauthorized markOrderAsPaid attempt for order ${orderId}`)
    return failure('Non autorisé')
  }

  // Validate inputs
  if (!orderId || typeof orderId !== 'string') {
    return failure('Order ID invalide')
  }
  if (!paymentId || typeof paymentId !== 'string') {
    return failure('Payment ID invalide')
  }

  const supabase = await createSupabaseServer()

  const paidUpdate: OrderUpdate = {
    status: 'paid',
    payment_id: paymentId,
    paid_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('orders')
    .update(paidUpdate as never)
    .eq('id', orderId)
    .eq('status', 'pending') // Only update if still pending

  if (error) {
    return failure(`Échec mise à jour paiement: ${error.message}`)
  }

  revalidatePath('/orders')
  revalidatePath(`/orders/${orderId}`)

  return success(undefined)
}
