'use server'

/**
 * Cart Server Actions
 * RULES: ZERO HARDCODE, ZERO FALLBACKS
 */

import { createSupabaseServer } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import { success, failure, type ActionResult } from '@/shared/types/actions.types'
import type { Product } from '@/features/marketplace/actions/products.actions'

export type CartItem = {
  id: string
  product_id: string
  quantity: number
  created_at: string
  product: Product
}

export type CartSummary = {
  items: CartItem[]
  itemCount: number
  totalQuantity: number
  subtotal: number
}

/**
 * Get user's cart with product details
 */
export async function getCart(): Promise<CartSummary> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return { items: [], itemCount: 0, totalQuantity: 0, subtotal: 0 }

  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      id,
      product_id,
      quantity,
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

  const items = (data || []).map(item => ({
    ...item,
    product: item.product as unknown as Product
  }))

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

  return {
    items,
    itemCount: items.length,
    totalQuantity,
    subtotal
  }
}

/**
 * Get cart count (total quantity) for current user
 */
export async function getCartCount(): Promise<number> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return 0

  const { data, error } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', user.id)

  if (error) return 0
  return data?.reduce((sum, item) => sum + item.quantity, 0) || 0
}

/**
 * Add product to cart
 */
export async function addToCart(productId: string, quantity: number = 1): Promise<ActionResult<void>> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return failure('Vous devez être connecté')
  if (quantity < 1) return failure('Quantité invalide')

  // Check if product exists and is active
  const { data: product } = await supabase
    .from('products')
    .select('id, status, stock_quantity, merchant_id')
    .eq('id', productId)
    .single()

  if (!product) return failure('Produit introuvable')
  if (product.status !== 'active') return failure('Ce produit n\'est plus disponible')
  if (product.merchant_id === user.id) return failure('Vous ne pouvez pas ajouter votre propre produit')

  // Check if already in cart
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .single()

  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + quantity
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('id', existingItem.id)

    if (error) return failure(error.message)
  } else {
    // Insert new item
    const { error } = await supabase
      .from('cart_items')
      .insert({ user_id: user.id, product_id: productId, quantity })

    if (error) return failure(error.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/marketplace')
  return success(undefined)
}

/**
 * Update cart item quantity
 */
export async function updateCartQuantity(productId: string, quantity: number): Promise<ActionResult<void>> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return failure('Vous devez être connecté')

  if (quantity < 1) {
    return removeFromCart(productId)
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('user_id', user.id)
    .eq('product_id', productId)

  if (error) return failure(error.message)

  revalidatePath('/dashboard')
  return success(undefined)
}

/**
 * Remove product from cart
 */
export async function removeFromCart(productId: string): Promise<ActionResult<void>> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return failure('Vous devez être connecté')

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId)

  if (error) return failure(error.message)

  revalidatePath('/dashboard')
  return success(undefined)
}

/**
 * Clear entire cart
 */
export async function clearCart(): Promise<ActionResult<void>> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return failure('Vous devez être connecté')

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', user.id)

  if (error) return failure(error.message)

  revalidatePath('/dashboard')
  return success(undefined)
}
