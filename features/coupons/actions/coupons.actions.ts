'use server'

/**
 * Coupon Server Actions
 * CRUD operations and validation for coupons
 */

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/shared/lib/supabase/server'
import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import {
  CouponCreateSchema,
  CouponUpdateSchema,
  CouponRuleSchema,
  type CouponContext,
} from '../schemas/coupon.schema'
import type {
  Coupon,
  CouponWithRules,
  CouponRule,
  ValidationResult,
  ValidateCouponResult,
} from '../types/coupon.types'
import { success, failure, type ActionResult } from '@/shared/types/actions.types'

// ============ CRUD Operations ============

/**
 * Get merchant's coupons
 */
export async function getMerchantCoupons(): Promise<CouponWithRules[]> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('coupons')
    .select('*, coupon_rules(*)')
    .eq('merchant_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch coupons: ${error.message}`)
  }

  return (data || []) as CouponWithRules[]
}

/**
 * Get single coupon by ID
 */
export async function getCoupon(id: string): Promise<CouponWithRules | null> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('coupons')
    .select('*, coupon_rules(*)')
    .eq('id', id)
    .eq('merchant_id', user.id)
    .single()

  if (error) return null
  return data as CouponWithRules | null
}

/**
 * Create new coupon
 */
export async function createCoupon(
  _prevState: ActionResult<Coupon> | null,
  formData: FormData
): Promise<ActionResult<Coupon>> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) {
    return failure('Non authentifié')
  }

  // Parse category IDs (multi-select)
  const categoryIds = formData.getAll('categoryIds')
    .map(v => Number(v))
    .filter(n => !isNaN(n) && n > 0)

  // Parse form data
  const rawData = {
    code: formData.get('code') || null,
    title: formData.get('title'),
    titleAr: formData.get('titleAr') || null,
    description: formData.get('description') || null,
    discountType: formData.get('discountType'),
    discountValue: formData.get('discountValue') ? Number(formData.get('discountValue')) : null,
    appliesTo: formData.get('appliesTo') || 'products',
    targetAudience: formData.get('targetAudience') || 'all',
    startDate: formData.get('startDate') || null,
    endDate: formData.get('endDate') || null,
    maxTotalUses: formData.get('maxTotalUses') ? Number(formData.get('maxTotalUses')) : null,
    maxUsesPerUser: formData.get('maxUsesPerUser') ? Number(formData.get('maxUsesPerUser')) : 1,
    minPurchaseAmount: formData.get('minPurchaseAmount') ? Number(formData.get('minPurchaseAmount')) : null,
    isActive: formData.get('isActive') === 'true',
    isPublic: formData.get('isPublic') !== 'false',
    categoryIds: categoryIds.length > 0 ? categoryIds : null,
  }

  // Validate
  const parsed = CouponCreateSchema.safeParse(rawData)
  if (!parsed.success) {
    return failure('Validation échouée', parsed.error.flatten().fieldErrors as Record<string, string[]>)
  }

  // Insert coupon
  const { data, error } = await supabase
    .from('coupons')
    .insert({
      merchant_id: user.id,
      code: parsed.data.code,
      title: parsed.data.title,
      title_ar: parsed.data.titleAr,
      description: parsed.data.description,
      discount_type: parsed.data.discountType,
      discount_value: parsed.data.discountValue,
      applies_to: parsed.data.appliesTo,
      target_audience: parsed.data.targetAudience,
      start_date: parsed.data.startDate?.toISOString(),
      end_date: parsed.data.endDate?.toISOString(),
      max_total_uses: parsed.data.maxTotalUses,
      max_uses_per_user: parsed.data.maxUsesPerUser,
      min_purchase_amount: parsed.data.minPurchaseAmount,
      is_active: parsed.data.isActive,
      is_public: parsed.data.isPublic,
    } as never)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return failure('Ce code existe déjà')
    }
    return failure(error.message)
  }

  // Create category rule if categories were selected
  const coupon = data as Coupon
  if (parsed.data.categoryIds && parsed.data.categoryIds.length > 0) {
    await supabase
      .from('coupon_rules')
      .insert({
        coupon_id: coupon.id,
        rule_type: 'category',
        target_ids: parsed.data.categoryIds.map(String),
      } as never)
  }

  revalidatePath('/dashboard')
  return success(data as Coupon)
}

/**
 * Update coupon
 */
export async function updateCoupon(
  couponId: string,
  _prevState: ActionResult<Coupon> | null,
  formData: FormData
): Promise<ActionResult<Coupon>> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) {
    return failure('Non authentifié')
  }

  // Parse category IDs (multi-select)
  const categoryIds = formData.getAll('categoryIds')
    .map(v => Number(v))
    .filter(n => !isNaN(n) && n > 0)

  // Build update object from form data
  const updates: Record<string, unknown> = {
    categoryIds: categoryIds.length > 0 ? categoryIds : null,
  }

  const fields = [
    'code', 'title', 'titleAr', 'description', 'discountType',
    'appliesTo', 'targetAudience', 'startDate', 'endDate', 'isActive', 'isPublic'
  ]

  fields.forEach(field => {
    const value = formData.get(field)
    if (value !== null) {
      updates[field] = value === '' ? null : value
    }
  })

  const numericFields = ['discountValue', 'maxTotalUses', 'maxUsesPerUser', 'minPurchaseAmount']
  numericFields.forEach(field => {
    const value = formData.get(field)
    if (value !== null && value !== '') {
      updates[field] = Number(value)
    }
  })

  // Validate
  const parsed = CouponUpdateSchema.safeParse(updates)
  if (!parsed.success) {
    return failure('Validation échouée', parsed.error.flatten().fieldErrors as Record<string, string[]>)
  }

  // Update
  const { data, error } = await supabase
    .from('coupons')
    .update({
      code: parsed.data.code,
      title: parsed.data.title,
      title_ar: parsed.data.titleAr,
      description: parsed.data.description,
      discount_type: parsed.data.discountType,
      discount_value: parsed.data.discountValue,
      applies_to: parsed.data.appliesTo,
      target_audience: parsed.data.targetAudience,
      start_date: parsed.data.startDate?.toISOString(),
      end_date: parsed.data.endDate?.toISOString(),
      max_total_uses: parsed.data.maxTotalUses,
      max_uses_per_user: parsed.data.maxUsesPerUser,
      min_purchase_amount: parsed.data.minPurchaseAmount,
      is_active: parsed.data.isActive,
      is_public: parsed.data.isPublic,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', couponId)
    .eq('merchant_id', user.id)
    .select()
    .single()

  if (error) {
    return failure(error.message)
  }

  // Update category rules: delete existing, insert new
  await supabase
    .from('coupon_rules')
    .delete()
    .eq('coupon_id', couponId)
    .eq('rule_type', 'category')

  if (categoryIds.length > 0) {
    await supabase
      .from('coupon_rules')
      .insert({
        coupon_id: couponId,
        rule_type: 'category',
        target_ids: categoryIds.map(String),
      } as never)
  }

  revalidatePath('/dashboard')
  return success(data as Coupon)
}

/**
 * Delete coupon
 */
export async function deleteCoupon(couponId: string): Promise<ActionResult<null>> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) {
    return failure('Non authentifié')
  }

  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('id', couponId)
    .eq('merchant_id', user.id)

  if (error) {
    return failure(error.message)
  }

  revalidatePath('/dashboard')
  return success(null)
}

/**
 * Toggle coupon active status
 */
export async function toggleCouponStatus(couponId: string): Promise<ActionResult<Coupon>> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) {
    return failure('Non authentifié')
  }

  // Get current status
  const { data: couponData } = await supabase
    .from('coupons')
    .select('is_active')
    .eq('id', couponId)
    .eq('merchant_id', user.id)
    .single()

  const coupon = couponData as { is_active: boolean } | null
  if (!coupon) {
    return failure('Coupon non trouvé')
  }

  // Toggle
  const { data, error } = await supabase
    .from('coupons')
    .update({ is_active: !coupon.is_active, updated_at: new Date().toISOString() } as never)
    .eq('id', couponId)
    .eq('merchant_id', user.id)
    .select()
    .single()

  if (error) {
    return failure(error.message)
  }

  revalidatePath('/dashboard')
  return success(data as Coupon)
}

/**
 * Toggle coupon public status (promote/hide from marketplace)
 */
export async function toggleCouponPublic(couponId: string): Promise<ActionResult<Coupon>> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) {
    return failure('Non authentifié')
  }

  const { data: couponData } = await supabase
    .from('coupons')
    .select('is_public')
    .eq('id', couponId)
    .eq('merchant_id', user.id)
    .single()

  const coupon = couponData as { is_public: boolean } | null
  if (!coupon) {
    return failure('Coupon non trouvé')
  }

  const { data, error } = await supabase
    .from('coupons')
    .update({ is_public: !coupon.is_public, updated_at: new Date().toISOString() } as never)
    .eq('id', couponId)
    .eq('merchant_id', user.id)
    .select()
    .single()

  if (error) {
    return failure(error.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/marketplace')
  return success(data as Coupon)
}

// ============ Public Coupons (Offers Tab) ============

export type PublicCouponFilters = {
  categoryId?: number
  discountType?: string
  expiringWithinDays?: number
}

export type PublicCoupon = CouponWithRules & {
  merchant?: { id: string; full_name: string } | null
}

/**
 * Get public coupons for offers tab
 */
export async function getPublicCoupons(filters?: PublicCouponFilters): Promise<PublicCoupon[]> {
  const supabase = await createSupabaseServer()

  const now = new Date().toISOString()

  let query = supabase
    .from('coupons')
    .select(`
      *,
      coupon_rules(*),
      merchant:profiles!merchant_id(id, full_name)
    `)
    .eq('is_public', true)
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order('created_at', { ascending: false })

  // Filter by discount type
  if (filters?.discountType) {
    query = query.eq('discount_type', filters.discountType)
  }

  // Filter by expiring soon
  if (filters?.expiringWithinDays) {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + filters.expiringWithinDays)
    query = query.lte('end_date', futureDate.toISOString())
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch public coupons: ${error.message}`)
  }

  let coupons = (data || []) as PublicCoupon[]

  // Filter by category (post-query since it's in coupon_rules)
  if (filters?.categoryId) {
    coupons = coupons.filter(coupon => {
      // If no category rules, coupon applies to all categories
      const categoryRules = coupon.coupon_rules?.filter(r => r.rule_type === 'category')
      if (!categoryRules || categoryRules.length === 0) return true

      // Check if category is in target_ids
      return categoryRules.some(rule =>
        rule.target_ids?.includes(String(filters.categoryId))
      )
    })
  }

  return coupons
}

/**
 * Save a coupon to user's wallet
 */
export async function saveCouponToWallet(couponId: string): Promise<ActionResult<null>> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) {
    return failure('Non authentifié')
  }

  // Verify coupon exists and is public
  const { data: couponData } = await supabase
    .from('coupons')
    .select('id, is_public, is_active, target_audience')
    .eq('id', couponId)
    .single()

  const coupon = couponData as { id: string; is_public: boolean; is_active: boolean; target_audience: string } | null

  if (!coupon || !coupon.is_public || !coupon.is_active) {
    return failure('Coupon non disponible')
  }

  // Check target audience
  if (coupon.target_audience === 'students' && user.profile?.role !== 'student') {
    return failure('Réservé aux étudiants')
  }
  if (coupon.target_audience === 'merchants' && user.profile?.role !== 'merchant') {
    return failure('Réservé aux marchands')
  }

  // Save to wallet
  const { error } = await supabase
    .from('saved_coupons')
    .insert({
      user_id: user.id,
      coupon_id: couponId,
    } as never)

  if (error) {
    if (error.code === '23505') {
      return failure('Déjà sauvegardé')
    }
    return failure(error.message)
  }

  revalidatePath('/profile/coupons')
  return success(null)
}

/**
 * Get user's saved coupons
 */
export async function getSavedCoupons(): Promise<(PublicCoupon & { saved_at: string; used_at: string | null })[]> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('saved_coupons')
    .select(`
      saved_at,
      used_at,
      coupon:coupons(
        *,
        coupon_rules(*),
        merchant:profiles!merchant_id(id, full_name)
      )
    `)
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch saved coupons: ${error.message}`)
  }

  // Type for saved_coupons query result
  type SavedCouponRow = {
    saved_at: string
    used_at: string | null
    coupon: PublicCoupon
  }

  // Flatten the structure
  return ((data as SavedCouponRow[] | null) || []).map(item => ({
    ...item.coupon,
    saved_at: item.saved_at,
    used_at: item.used_at,
  }))
}

/**
 * Remove a saved coupon from wallet
 */
export async function removeSavedCoupon(couponId: string): Promise<ActionResult<null>> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) {
    return failure('Non authentifié')
  }

  const { error } = await supabase
    .from('saved_coupons')
    .delete()
    .eq('user_id', user.id)
    .eq('coupon_id', couponId)

  if (error) {
    return failure(error.message)
  }

  revalidatePath('/profile/coupons')
  return success(null)
}

// ============ Validation & Application ============

/**
 * Validate a coupon code
 */
export async function validateCoupon(
  code: string,
  context: CouponContext
): Promise<ValidateCouponResult> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) {
    return { valid: false, error: 'Vous devez être connecté' }
  }

  // Fetch coupon
  const { data: couponData, error } = await supabase
    .from('coupons')
    .select('*, coupon_rules(*)')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()

  const coupon = couponData as CouponWithRules | null
  if (error || !coupon) {
    return { valid: false, error: 'Code invalide' }
  }

  const now = new Date()

  // Check dates
  if (coupon.start_date && now < new Date(coupon.start_date)) {
    return { valid: false, error: 'Code pas encore actif' }
  }
  if (coupon.end_date && now > new Date(coupon.end_date)) {
    return { valid: false, error: 'Code expiré' }
  }

  // Check global limit
  if (coupon.max_total_uses && coupon.current_uses >= coupon.max_total_uses) {
    return { valid: false, error: 'Code épuisé' }
  }

  // Check user limit
  const { count } = await supabase
    .from('coupon_usages')
    .select('*', { count: 'exact', head: true })
    .eq('coupon_id', coupon.id)
    .eq('user_id', user.id)

  if (coupon.max_uses_per_user && (count || 0) >= coupon.max_uses_per_user) {
    return { valid: false, error: 'Vous avez déjà utilisé ce code' }
  }

  // Check context
  const contextMap: Record<string, string> = {
    product: 'products',
    event: 'events',
    service: 'delivery',
  }

  if (coupon.applies_to !== 'all' && coupon.applies_to !== contextMap[context.type]) {
    return { valid: false, error: 'Code non applicable ici' }
  }

  // Check audience
  if (coupon.target_audience === 'students' && user.profile?.role !== 'student') {
    return { valid: false, error: 'Réservé aux étudiants' }
  }
  if (coupon.target_audience === 'merchants' && user.profile?.role !== 'merchant') {
    return { valid: false, error: 'Réservé aux marchands' }
  }

  // Check rules
  if (coupon.coupon_rules && coupon.coupon_rules.length > 0) {
    const isEligible = coupon.coupon_rules.some((rule: CouponRule) => {
      if (rule.rule_type === 'wilaya' && context.wilaya) {
        return rule.target_wilayas?.includes(context.wilaya)
      }
      if (rule.rule_type === 'specific_products') {
        return rule.target_ids?.includes(context.targetId)
      }
      if (rule.rule_type === 'category' && context.categoryId) {
        return rule.target_ids?.includes(String(context.categoryId))
      }
      return true
    })

    if (!isEligible) {
      return { valid: false, error: 'Code non applicable à cet article' }
    }
  }

  // Check minimum amount
  if (coupon.min_purchase_amount && context.amount && context.amount < coupon.min_purchase_amount) {
    return { valid: false, error: `Montant minimum: ${coupon.min_purchase_amount} DA` }
  }

  // Calculate discount
  let discountAmount = 0
  if (coupon.discount_type === 'percentage' && context.amount && coupon.discount_value) {
    discountAmount = (context.amount * coupon.discount_value) / 100
  } else if (coupon.discount_type === 'fixed_amount' && coupon.discount_value) {
    discountAmount = Math.min(coupon.discount_value, context.amount || 0)
  } else if (coupon.discount_type === 'free_shipping') {
    discountAmount = context.amount || 0
  }

  return {
    valid: true,
    couponId: coupon.id,
    discountAmount,
    discountType: coupon.discount_type,
    couponTitle: coupon.title,
  }
}

/**
 * Apply coupon to order (record usage)
 */
export async function applyCouponToOrder(
  couponId: string,
  orderId: string,
  context: CouponContext,
  discountAmount: number
): Promise<ActionResult<null>> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) {
    return failure('Non authentifié')
  }

  // Record usage
  const { error: usageError } = await supabase
    .from('coupon_usages')
    .insert({
      coupon_id: couponId,
      user_id: user.id,
      used_on: context.type,
      target_id: context.targetId,
      order_id: orderId,
      discount_amount: discountAmount,
    } as never)

  if (usageError) {
    console.error('Error recording coupon usage:', usageError)
  }

  // Increment counter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.rpc as any)('increment_coupon_usage', { p_coupon_id: couponId })

  return success(null)
}

/**
 * Get coupon usage stats for merchant
 */
export async function getCouponStats(couponId: string): Promise<{
  totalUses: number
  totalDiscount: number
  usageByDay: { date: string; count: number }[]
}> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) {
    return { totalUses: 0, totalDiscount: 0, usageByDay: [] }
  }

  // Verify ownership
  const { data: coupon } = await supabase
    .from('coupons')
    .select('id')
    .eq('id', couponId)
    .eq('merchant_id', user.id)
    .single()

  if (!coupon) {
    return { totalUses: 0, totalDiscount: 0, usageByDay: [] }
  }

  // Get usage stats
  const { data: usagesData } = await supabase
    .from('coupon_usages')
    .select('discount_amount, used_at')
    .eq('coupon_id', couponId)

  type UsageRow = { discount_amount: number; used_at: string }
  const usages = usagesData as UsageRow[] | null

  if (!usages || usages.length === 0) {
    return { totalUses: 0, totalDiscount: 0, usageByDay: [] }
  }

  const totalUses = usages.length
  const totalDiscount = usages.reduce((sum, u) => sum + Number(u.discount_amount), 0)

  // Group by day
  const byDay = usages.reduce((acc, u) => {
    const date = new Date(u.used_at).toISOString().split('T')[0]
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const usageByDay = Object.entries(byDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return { totalUses, totalDiscount, usageByDay }
}
