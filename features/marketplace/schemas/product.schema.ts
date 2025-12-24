/**
 * Product Schemas - Zod validation
 * All product inputs validated before database operations
 */

import { z } from 'zod'

// Price in DZD (Algerian Dinar)
const priceSchema = z
  .number()
  .positive('Price must be positive')
  .max(100_000_000, 'Price too high') // 100 million DZD max

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

// Create product schema
export const ProductCreateSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title too long')
    .trim(),
  titleAr: z.string().max(255, 'Arabic title too long').optional(),
  description: z.string().max(5000, 'Description too long').optional(),
  price: priceSchema,
  originalPrice: priceSchema.optional(),
  categoryId: z.number().int().positive('Select a category'),
  wilayaId: z.number().int().min(1).max(58, 'Select a valid wilaya'),
  images: z
    .array(imageUrlSchema)
    .min(1, 'At least one image required')
    .max(5, 'Maximum 5 images allowed'),
  status: z.enum(['draft', 'active']).default('active'),
})

export type ProductCreateInput = z.infer<typeof ProductCreateSchema>

// Update product schema (all fields optional)
export const ProductUpdateSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title too long')
    .trim()
    .optional(),
  titleAr: z.string().max(255, 'Arabic title too long').optional(),
  description: z.string().max(5000, 'Description too long').optional(),
  price: priceSchema.optional(),
  originalPrice: priceSchema.optional().nullable(),
  categoryId: z.number().int().positive('Select a category').optional(),
  wilayaId: z.number().int().min(1).max(58, 'Select a valid wilaya').optional(),
  images: z
    .array(imageUrlSchema)
    .min(1, 'At least one image required')
    .max(5, 'Maximum 5 images allowed')
    .optional(),
  status: z.enum(['draft', 'active', 'sold', 'archived']).optional(),
})

export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>

// Product search/filter schema
export const ProductFilterSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  wilayaId: z.number().int().min(1).max(58).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().positive().optional(),
  status: z.enum(['active', 'sold']).optional().default('active'),
  search: z.string().max(100).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['created_at', 'price', 'views_count']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type ProductFilterInput = z.infer<typeof ProductFilterSchema>

// Product ID param validation
export const ProductIdSchema = z.object({
  id: z.string().uuid('Invalid product ID'),
})

export type ProductIdInput = z.infer<typeof ProductIdSchema>
