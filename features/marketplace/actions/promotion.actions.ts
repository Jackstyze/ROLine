'use server'

/**
 * Promotion Actions
 * Handle product, coupon, and event promotion with payment
 */

import { createSupabaseServer } from '@/shared/lib/supabase/server'
import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import { revalidatePath } from 'next/cache'
import { success, failure, type ActionResult } from '@/shared/types/actions.types'

export type PromotionPackage = {
  id: number
  name: string
  name_ar: string
  tier: 'basic' | 'premium' | 'featured'
  duration_days: number
  price: number
  description: string | null
}

export type PromotableItemType = 'product' | 'coupon' | 'event'

/**
 * Get available promotion packages
 */
export async function getPromotionPackages(): Promise<PromotionPackage[]> {
  const supabase = await createSupabaseServer()

  const { data, error } = await supabase
    .from('promotion_packages')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch packages: ${error.message}`)
  }

  return data as PromotionPackage[]
}

/**
 * Create promotion purchase and initiate payment
 */
export async function createPromotionPurchase(
  itemId: string,
  packageId: number,
  itemType: PromotableItemType = 'product'
): Promise<ActionResult<{ checkoutUrl: string }>> {
  const user = await getCurrentUser()

  if (!user) {
    return failure('Non authentifié')
  }

  const supabase = await createSupabaseServer()

  // Verify item ownership based on type
  const tableMap = { product: 'products', coupon: 'coupons', event: 'events' } as const
  const ownerField = { product: 'merchant_id', coupon: 'merchant_id', event: 'organizer_id' } as const
  const tableName = tableMap[itemType]

  const { data: item, error: itemError } = await supabase
    .from(tableName)
    .select('id, title')
    .eq('id', itemId)
    .eq(ownerField[itemType], user.id)
    .single()

  if (itemError || !item) {
    const labels = { product: 'Produit', coupon: 'Coupon', event: 'Événement' }
    return failure(`${labels[itemType]} non trouvé`)
  }

  // Get package details
  const { data: pkg, error: pkgError } = await supabase
    .from('promotion_packages')
    .select('*')
    .eq('id', packageId)
    .single()

  if (pkgError || !pkg) {
    return failure('Pack non trouvé')
  }

  // Create purchase record
  const { data: purchase, error: purchaseError } = await supabase
    .from('promotion_purchases')
    .insert({
      product_id: itemType === 'product' ? itemId : null,
      coupon_id: itemType === 'coupon' ? itemId : null,
      event_id: itemType === 'event' ? itemId : null,
      merchant_id: user.id,
      package_id: packageId,
      amount: (pkg as { price: number }).price,
      payment_status: 'pending',
    } as never)
    .select()
    .single()

  if (purchaseError) {
    return failure(`Erreur création: ${purchaseError.message}`)
  }

  // MVP Demo mode: auto-activate promotion (bypass payment for testing)
  // TODO: Enable real Chargily payment when ready
  const DEMO_MODE = true // Set to false to enable real payment
  const chargilyApiKey = process.env.CHARGILY_API_KEY

  if (DEMO_MODE || !chargilyApiKey) {
    const pkgTyped = pkg as { tier: string; duration_days: number }
    const purchaseTyped = purchase as { id: string }
    await activatePromotion(itemId, itemType, pkgTyped.tier, pkgTyped.duration_days, purchaseTyped.id)

    const redirectMap = {
      product: `/sell?promoted=${itemId}`,
      coupon: `/dashboard/coupons?promoted=${itemId}`,
      event: `/dashboard/events?promoted=${itemId}`,
    }
    return success({ checkoutUrl: redirectMap[itemType] })
  }

  // Real Chargily integration would go here
  // const checkout = await chargily.createCheckout({...})
  // return success({ checkoutUrl: checkout.url })

  return failure('Paiement non configuré')
}

/**
 * Activate promotion after successful payment
 */
async function activatePromotion(
  itemId: string,
  itemType: PromotableItemType,
  tier: string,
  durationDays: number,
  purchaseId: string
): Promise<void> {
  const supabase = await createSupabaseServer()

  const now = new Date()
  const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

  // Update item based on type
  const tableMap = { product: 'products', coupon: 'coupons', event: 'events' } as const
  const tableName = tableMap[itemType]

  // Field names differ by table
  const updateData = itemType === 'product'
    ? { is_promoted: true, promotion_tier: tier, promoted_until: endsAt.toISOString() }
    : { is_featured: true, promotion_tier: tier, promoted_until: endsAt.toISOString() }

  await supabase
    .from(tableName)
    .update(updateData as never)
    .eq('id', itemId)

  // Update purchase record
  await supabase
    .from('promotion_purchases')
    .update({
      payment_status: 'paid',
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
    } as never)
    .eq('id', purchaseId)

  revalidatePath('/')
  revalidatePath('/marketplace')
  revalidatePath('/sell')
  revalidatePath('/dashboard/coupons')
  revalidatePath('/dashboard/events')
}

/**
 * Get promoted products for homepage
 */
export async function getFeaturedProducts(limit = 6) {
  const supabase = await createSupabaseServer()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      merchant:profiles!merchant_id(id, full_name),
      wilaya:wilayas(id, name, name_ar)
    `)
    .eq('status', 'active')
    .eq('is_promoted', true)
    .gte('promoted_until', new Date().toISOString())
    .order('promotion_tier', { ascending: false }) // featured > premium > basic
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch featured products: ${error.message}`)
  }

  return data || []
}
