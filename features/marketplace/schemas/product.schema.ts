/**
 * Product Schemas - Zod validation
 * All product inputs validated before database operations
 */

import { z } from 'zod'
import {
  WILAYA_MIN,
  WILAYA_MAX,
  MAX_PRODUCT_IMAGES,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_SEARCH_LENGTH,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '@/shared/constants/limits'

// Price in DZD (Algerian Dinar)
const priceSchema = z
  .number()
  .positive('Price must be positive')
  .max(100_000_000, 'Price too high') // 100 million DZD max

// Wilaya schema - centralized
const wilayaSchema = z
  .number()
  .int()
  .min(WILAYA_MIN, 'Select a valid wilaya')
  .max(WILAYA_MAX, 'Select a valid wilaya')

// Image URL validation
const imageUrlSchema = z
  .string()
  .url('Invalid image URL')
  .refine(
    (url) =>
      url.includes('supabase.co') ||
      url.includes('cloudflare') ||
      url.startsWith('https://'),
    'Image must be hosted on approved CDN'
  )

// Delivery fee schema
const deliveryFeeSchema = z
  .number()
  .min(0, 'Delivery fee cannot be negative')
  .max(50_000, 'Delivery fee too high') // 50,000 DZD max

// Stock quantity schema
const stockQuantitySchema = z
  .number()
  .int()
  .min(0, 'Stock cannot be negative')
  .max(1_000_000, 'Stock too high')
  .nullable()
  .optional()

// Create product schema
export const ProductCreateSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(MAX_TITLE_LENGTH, 'Title too long')
    .trim(),
  titleAr: z.string().max(MAX_TITLE_LENGTH, 'Arabic title too long').optional(),
  description: z.string().max(MAX_DESCRIPTION_LENGTH, 'Description too long').optional(),
  price: priceSchema,
  originalPrice: priceSchema.optional(),
  deliveryFee: deliveryFeeSchema.optional(),
  stockQuantity: stockQuantitySchema,
  categoryId: z.number().int().positive('Select a category'),
  wilayaId: wilayaSchema,
  images: z
    .array(imageUrlSchema)
    .min(1, 'At least one image required')
    .max(MAX_PRODUCT_IMAGES, `Maximum ${MAX_PRODUCT_IMAGES} images allowed`),
  status: z.enum(['draft', 'active']).default('active'),
})

export type ProductCreateInput = z.infer<typeof ProductCreateSchema>

// Update product schema (all fields optional)
export const ProductUpdateSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(MAX_TITLE_LENGTH, 'Title too long')
    .trim()
    .optional(),
  titleAr: z.string().max(MAX_TITLE_LENGTH, 'Arabic title too long').optional(),
  description: z.string().max(MAX_DESCRIPTION_LENGTH, 'Description too long').optional(),
  price: priceSchema.optional(),
  originalPrice: priceSchema.optional().nullable(),
  deliveryFee: deliveryFeeSchema.optional().nullable(),
  stockQuantity: stockQuantitySchema,
  categoryId: z.number().int().positive('Select a category').optional(),
  wilayaId: wilayaSchema.optional(),
  images: z
    .array(imageUrlSchema)
    .min(1, 'At least one image required')
    .max(MAX_PRODUCT_IMAGES, `Maximum ${MAX_PRODUCT_IMAGES} images allowed`)
    .optional(),
  status: z.enum(['draft', 'active', 'sold', 'archived']).optional(),
})

export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>

// Product search/filter schema
export const ProductFilterSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  wilayaId: wilayaSchema.optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().positive().optional(),
  status: z.enum(['active', 'sold']).optional().default('active'),
  search: z.string().max(MAX_SEARCH_LENGTH).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  sortBy: z.enum(['created_at', 'price', 'views_count']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type ProductFilterInput = z.infer<typeof ProductFilterSchema>

// Product ID param validation
export const ProductIdSchema = z.object({
  id: z.string().uuid('Invalid product ID'),
})

export type ProductIdInput = z.infer<typeof ProductIdSchema>
