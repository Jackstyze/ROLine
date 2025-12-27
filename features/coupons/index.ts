/**
 * Coupons Feature - Public API
 */

// Actions
export {
  getMerchantCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  validateCoupon,
  applyCouponToOrder,
  getCouponStats,
} from './actions/coupons.actions'

// Components
export { CouponInput } from './components/CouponInput'
export { CouponForm } from './components/CouponForm'
export { MerchantCouponsList } from './components/MerchantCouponsList'
export { ToggleCouponButton } from './components/ToggleCouponButton'
export { DeleteCouponButton } from './components/DeleteCouponButton'

// Types
export type {
  Coupon,
  CouponRule,
  CouponUsage,
  CouponWithRules,
  ValidationResult,
  ValidateCouponResult,
} from './types/coupon.types'

// Schemas
export {
  CouponCreateSchema,
  CouponUpdateSchema,
  CouponRuleSchema,
  CouponContextSchema,
  ApplyCouponSchema,
  DiscountTypeSchema,
  AppliesToSchema,
  TargetAudienceSchema,
} from './schemas/coupon.schema'

export type {
  CouponCreate,
  CouponUpdate,
  CouponContext,
  ApplyCouponRequest,
  DiscountType,
  AppliesTo,
  TargetAudience,
} from './schemas/coupon.schema'
