'use server'

/**
 * Product Recommendations Actions
 * Hybrid: LightFM ML + Rule-based fallback
 *
 * ARCHITECTURE:
 * - Primary: LightFM recommendations from Railway ML service
 * - Fallback: Rule-based (wilaya + categories from past orders)
 * - Explicit fallback indication in response
 *
 * RULES:
 * - ZERO SILENT FAILURES: ML errors logged and fallback used
 * - Graceful degradation: Always return results
 */

import { createSupabaseServer } from '@/shared/lib/supabase/server'
import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import { recommend, isMLServiceConfigured } from '@/shared/lib/ml'
import type { Product } from './products.actions'

// =============================================================================
// ML-ENHANCED RECOMMENDATIONS
// =============================================================================

/**
 * Get ML-powered recommendations with rule-based fallback
 *
 * @param limit - Number of products to return
 * @returns Products with optional ML metadata
 */
export async function getMLRecommendations(
  limit: number = 8
): Promise<{ products: Product[]; isMLPowered: boolean; isColdStart: boolean }> {
  const user = await getCurrentUser()

  if (!user) {
    const products = await getLatestProducts(limit)
    return { products, isMLPowered: false, isColdStart: true }
  }

  // Try ML recommendations first
  if (isMLServiceConfigured()) {
    try {
      const mlResponse = await recommend({
        user_id: user.id,
        entity_types: ['product'],
        limit,
        exclude_ids: [],
      })

      // If ML returned results, fetch full product data
      if (mlResponse.recommendations.length > 0 && !mlResponse.fallback_used) {
        const productIds = mlResponse.recommendations.map((r) => r.item_id)
        const products = await fetchProductsByIds(productIds)

        // Sort by ML score order
        const idOrder = new Map(productIds.map((id, idx) => [id, idx]))
        products.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0))

        return {
          products,
          isMLPowered: true,
          isColdStart: mlResponse.is_cold_start,
        }
      }
    } catch (error) {
      console.error('[RECOMMENDATIONS] ML service error, using fallback:', error)
    }
  }

  // Fallback to rule-based
  const products = await getRecommendedProducts(limit)
  return { products, isMLPowered: false, isColdStart: false }
}

/**
 * Fetch products by IDs maintaining order
 */
async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return []

  const supabase = await createSupabaseServer()

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
    .in('id', ids)
    .eq('status', 'active')

  if (error) {
    console.error('[RECOMMENDATIONS] Failed to fetch products:', error.message)
    return []
  }

  return data as Product[]
}

// =============================================================================
// RULE-BASED RECOMMENDATIONS (FALLBACK)
// =============================================================================

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
