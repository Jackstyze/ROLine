/**
 * Chargily Pay Schemas - Zod validation
 * API v2 compliant
 */

import { z } from 'zod'

// Supported payment methods
export const PaymentMethodSchema = z.enum(['edahabia', 'cib'])
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>

// Checkout create request
export const CheckoutCreateSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.literal('dzd'),
  success_url: z.string().url(),
  failure_url: z.string().url().optional(),
  webhook_endpoint: z.string().url().optional(),
  payment_method: PaymentMethodSchema.optional(),
  customer_id: z.string().optional(),
  description: z.string().max(500).optional(),
  locale: z.enum(['ar', 'en', 'fr']).default('fr'),
  metadata: z.record(z.string(), z.string()).optional(),
})

export type CheckoutCreateInput = z.infer<typeof CheckoutCreateSchema>

// Checkout response from Chargily
export const CheckoutResponseSchema = z.object({
  id: z.string(),
  entity: z.literal('checkout'),
  livemode: z.boolean(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['pending', 'paid', 'failed', 'canceled', 'expired']),
  locale: z.string(),
  description: z.string().nullable(),
  success_url: z.string(),
  failure_url: z.string().nullable(),
  webhook_endpoint: z.string().nullable(),
  customer_id: z.string().nullable(),
  payment_link_id: z.string().nullable(),
  checkout_url: z.string(),
  created_at: z.number(),
  updated_at: z.number(),
  metadata: z.record(z.string(), z.string()).nullable(),
})

export type CheckoutResponse = z.infer<typeof CheckoutResponseSchema>

// Webhook payload
export const WebhookPayloadSchema = z.object({
  id: z.string(),
  entity: z.string(),
  livemode: z.boolean(),
  type: z.enum(['checkout.paid', 'checkout.failed', 'checkout.canceled', 'checkout.expired']),
  data: CheckoutResponseSchema,
  created_at: z.number(),
  updated_at: z.number(),
})

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>

// Order checkout input (from our app)
export const OrderCheckoutSchema = z.object({
  orderId: z.string().uuid(),
  paymentMethod: PaymentMethodSchema,
})

export type OrderCheckoutInput = z.infer<typeof OrderCheckoutSchema>
