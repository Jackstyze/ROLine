/**
 * Coupon Types
 * Database and API types for coupon system
 */

export type Coupon = {
  id: string
  merchant_id: string | null
  code: string | null
  title: string
  title_ar: string | null
  description: string | null
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'access_unlock'
  discount_value: number | null
  applies_to: 'products' | 'events' | 'premium_access' | 'delivery' | 'ride_share' | 'all'
  target_audience: 'all' | 'students' | 'merchants' | 'specific_users'
  start_date: string | null
  end_date: string | null
  max_total_uses: number | null
  max_uses_per_user: number
  current_uses: number
  min_purchase_amount: number | null
  is_active: boolean
  is_public: boolean
  is_featured: boolean
  promotion_tier: 'basic' | 'premium' | 'featured' | null
  promoted_until: string | null
  created_at: string
  updated_at: string
}

export type CouponRule = {
  id: string
  coupon_id: string
  rule_type: 'category' | 'specific_products' | 'specific_events' | 'wilaya' | 'merchant'
  target_ids: string[] | null
  target_wilayas: number[] | null
  created_at: string
}

export type CouponUsage = {
  id: string
  coupon_id: string
  user_id: string
  used_on: 'product' | 'event' | 'service'
  target_id: string | null
  order_id: string | null
  discount_amount: number
  used_at: string
}

export type CouponWithRules = Coupon & {
  coupon_rules: CouponRule[]
}

export type ValidationResult = {
  valid: boolean
  couponId: string
  discountAmount: number
  discountType: Coupon['discount_type']
  couponTitle: string
}

export type CouponError = {
  valid: false
  error: string
}

export type ValidateCouponResult = ValidationResult | CouponError
