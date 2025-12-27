/**
 * Coupon System Schemas
 * Zod validation for unified coupon system
 */

import { z } from 'zod'

// Enums
export const DiscountTypeSchema = z.enum([
  'percentage',
  'fixed_amount',
  'free_shipping',
  'access_unlock'
])

export const AppliesToSchema = z.enum([
  'products',
  'events',
  'premium_access',
  'delivery',
  'ride_share',
  'all'
])

export const TargetAudienceSchema = z.enum([
  'all',
  'students',
  'merchants',
  'specific_users'
])

export const RuleTypeSchema = z.enum([
  'category',
  'specific_products',
  'specific_events',
  'wilaya',
  'merchant'
])

// Create coupon schema
export const CouponCreateSchema = z.object({
  code: z.string()
    .min(3, 'Code doit avoir au moins 3 caractères')
    .max(50, 'Code trop long')
    .toUpperCase()
    .regex(/^[A-Z0-9_-]+$/, 'Code invalide (lettres, chiffres, _ et - seulement)')
    .optional()
    .nullable(),

  title: z.string()
    .min(3, 'Titre requis')
    .max(255),

  titleAr: z.string().max(255).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),

  discountType: DiscountTypeSchema,
  discountValue: z.number()
    .min(0, 'Valeur doit être positive')
    .max(100000, 'Valeur trop élevée')
    .optional()
    .nullable(),

  appliesTo: AppliesToSchema.default('products'),
  targetAudience: TargetAudienceSchema.default('all'),

  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),

  maxTotalUses: z.number().int().positive().optional().nullable(),
  maxUsesPerUser: z.number().int().positive().default(1),

  minPurchaseAmount: z.number().min(0).optional().nullable(),

  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),

  // Category restrictions (optional)
  categoryIds: z.array(z.number().int().positive()).optional().nullable(),
}).refine(
  data => {
    if (data.discountType === 'percentage' && data.discountValue) {
      return data.discountValue <= 100
    }
    return true
  },
  { message: "Pourcentage ne peut pas dépasser 100%", path: ['discountValue'] }
).refine(
  data => {
    if (data.endDate && data.startDate) {
      return data.endDate > data.startDate
    }
    return true
  },
  { message: "Date de fin doit être après date de début", path: ['endDate'] }
)

// Update coupon schema (all fields optional)
export const CouponUpdateSchema = CouponCreateSchema.partial()

// Coupon rule schema
export const CouponRuleSchema = z.object({
  ruleType: RuleTypeSchema,
  targetIds: z.array(z.string().uuid()).optional().nullable(),
  targetWilayas: z.array(z.number().int().min(1).max(58)).optional().nullable(),
})

// Validate coupon context
export const CouponContextSchema = z.object({
  type: z.enum(['product', 'event', 'service']),
  targetId: z.string().uuid(),
  amount: z.number().optional(),
  wilaya: z.number().int().min(1).max(58).optional(),
  categoryId: z.number().int().optional(),
})

// Apply coupon request
export const ApplyCouponSchema = z.object({
  code: z.string().min(1).toUpperCase(),
  context: CouponContextSchema,
})

// Types
export type DiscountType = z.infer<typeof DiscountTypeSchema>
export type AppliesTo = z.infer<typeof AppliesToSchema>
export type TargetAudience = z.infer<typeof TargetAudienceSchema>
export type RuleType = z.infer<typeof RuleTypeSchema>
export type CouponCreate = z.infer<typeof CouponCreateSchema>
export type CouponUpdate = z.infer<typeof CouponUpdateSchema>
export type CouponRule = z.infer<typeof CouponRuleSchema>
export type CouponContext = z.infer<typeof CouponContextSchema>
export type ApplyCouponRequest = z.infer<typeof ApplyCouponSchema>
