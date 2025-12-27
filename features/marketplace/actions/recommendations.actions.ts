'use server'

/**
 * Product Recommendations Actions
 * Logic: Wilaya + Categories from past orders
 */

import { createSupabaseServer } from '@/shared/lib/supabase/server'
import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import type { Product } from './products.actions'

/**
 * Get recommended products for user
 * Based on: same wilaya + categories from past orders
 */
export async function getRecommendedProducts(limit: number = 8): Promise<Product[]> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return []

  const userId = user.id
  const userWilaya = user.profile?.wilaya_id

  // Get categories from user's past orders
  const { data: orderCategories } = await supabase
    .from('orders')
    .select('product:products(category_id)')
    .eq('buyer_id', userId)
    .not('product', 'is', null)

  const categoryIds = [...new Set(
    (orderCategories || [])
      .map(o => (o.product as { category_id: number | null })?.category_id)
      .filter((id): id is number => id !== null)
  )]

  // Build query for recommended products
  let query = supabase
    .from('products')
    .select(`
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
    `)
    .eq('status', 'active')
    .neq('merchant_id', userId)

  // Filter by wilaya or categories if available
  if (userWilaya && categoryIds.length > 0) {
    query = query.or(`wilaya_id.eq.${userWilaya},category_id.in.(${categoryIds.join(',')})`)
  } else if (userWilaya) {
    query = query.eq('wilaya_id', userWilaya)
  } else if (categoryIds.length > 0) {
    query = query.in('category_id', categoryIds)
  }

  const { data, error } = await query
    .order('is_promoted', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data as Product[]
}

/**
 * Get featured/promoted products
 */
export async function getFeaturedProducts(limit: number = 8): Promise<Product[]> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  const { data, error } = await supabase
    .from('products')
    .select(`
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
    `)
    .eq('status', 'active')
    .eq('is_promoted', true)
    .neq('merchant_id', user?.id || '')
    .order('views_count', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data as Product[]
}

/**
 * Get latest products
 */
export async function getLatestProducts(limit: number = 8): Promise<Product[]> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  const { data, error } = await supabase
    .from('products')
    .select(`
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
    `)
    .eq('status', 'active')
    .neq('merchant_id', user?.id || '')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data as Product[]
}
