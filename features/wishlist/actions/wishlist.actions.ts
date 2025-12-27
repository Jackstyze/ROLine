'use server'

/**
 * Wishlist Server Actions
 * RULES: ZERO HARDCODE, ZERO FALLBACKS
 */

import { createSupabaseServer } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import { success, failure, type ActionResult } from '@/shared/types/actions.types'
import type { Product } from '@/features/marketplace/actions/products.actions'

export type WishlistItem = {
  id: string
  product_id: string
  created_at: string
  product: Product
}

/**
 * Get user's wishlist with product details
 */
export async function getWishlist(): Promise<WishlistItem[]> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('user_wishlist')
    .select(`
      id,
      product_id,
      created_at,
      product:products (
        id,
        merchant_id,
        category_id,
        title,
        title_ar,
        description,
        price,
        original_price,
        delivery_fee,
        images,
        wilaya_id,
        status,
        stock_quantity,
        views_count,
        created_at,
        updated_at,
        merchant:profiles!products_merchant_id_fkey (id, full_name, avatar_url),
        category:categories (id, name, name_ar),
        wilaya:wilayas (id, name, name_ar)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data || []).map(item => ({
    ...item,
    product: item.product as unknown as Product
  }))
}

/**
 * Get wishlist count for current user
 */
export async function getWishlistCount(): Promise<number> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return 0

  const { count, error } = await supabase
    .from('user_wishlist')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (error) return 0
  return count || 0
}

/**
 * Check if product is in user's wishlist
 */
export async function isInWishlist(productId: string): Promise<boolean> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return false

  const { data } = await supabase
    .from('user_wishlist')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .single()

  return !!data
}

/**
 * Add product to wishlist
 */
export async function addToWishlist(productId: string): Promise<ActionResult<void>> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return failure('Vous devez être connecté')

  const { error } = await supabase
    .from('user_wishlist')
    .insert({ user_id: user.id, product_id: productId })

  if (error) {
    if (error.code === '23505') return failure('Produit déjà dans vos favoris')
    return failure(error.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/marketplace')
  return success(undefined)
}

/**
 * Remove product from wishlist
 */
export async function removeFromWishlist(productId: string): Promise<ActionResult<void>> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return failure('Vous devez être connecté')

  const { error } = await supabase
    .from('user_wishlist')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId)

  if (error) return failure(error.message)

  revalidatePath('/dashboard')
  revalidatePath('/marketplace')
  return success(undefined)
}

/**
 * Toggle product in wishlist
 */
export async function toggleWishlist(productId: string): Promise<ActionResult<{ added: boolean }>> {
  const inWishlist = await isInWishlist(productId)

  if (inWishlist) {
    const result = await removeFromWishlist(productId)
    if (!result.success) return failure(result.error)
    return success({ added: false })
  } else {
    const result = await addToWishlist(productId)
    if (!result.success) return failure(result.error)
    return success({ added: true })
  }
}
