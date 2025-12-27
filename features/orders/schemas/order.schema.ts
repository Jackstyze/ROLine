/**
 * Order Schemas - Zod validation
 */

import { z } from 'zod'
import {
  WILAYA_MIN,
  WILAYA_MAX,
  MAX_ADDRESS_LENGTH,
  MAX_NOTES_LENGTH,
} from '@/shared/constants/limits'

// Create order schema
export const OrderCreateSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  paymentMethod: z.enum(['cod', 'edahabia', 'cib'], {
    message: 'Select a payment method',
  }),
  shippingAddress: z.string().min(10, 'Address too short').max(MAX_ADDRESS_LENGTH, 'Address too long'),
  shippingWilaya: z.number().int().min(WILAYA_MIN).max(WILAYA_MAX, 'Select a valid wilaya'),
  notes: z.string().max(MAX_NOTES_LENGTH, 'Notes too long').optional(),
  couponCode: z.string().max(50).optional(), // Optional coupon code
})

export type OrderCreateInput = z.infer<typeof OrderCreateSchema>

// Update order status schema
export const OrderStatusUpdateSchema = z.object({
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']),
})

export type OrderStatusUpdateInput = z.infer<typeof OrderStatusUpdateSchema>
