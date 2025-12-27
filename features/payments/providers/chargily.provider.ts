/**
 * Chargily Pay Provider
 * API v2 - Factory pattern
 *
 * Docs: https://dev.chargily.com/pay-v2/
 */

import { createHmac, timingSafeEqual } from 'crypto'
import {
  CheckoutCreateSchema,
  CheckoutResponseSchema,
  WebhookPayloadSchema,
  type CheckoutCreateInput,
  type CheckoutResponse,
  type WebhookPayload,
} from '../schemas/chargily.schema'

// Chargily config from env
type ChargilyConfig = {
  apiKey: string
  secretKey: string
  mode: 'test' | 'live'
}

// Lazy config loader
function getConfig(): ChargilyConfig {
  const apiKey = process.env.CHARGILY_API_KEY
  const secretKey = process.env.CHARGILY_SECRET_KEY
  const mode = process.env.CHARGILY_MODE as 'test' | 'live'

  if (!apiKey || !secretKey) {
    throw new Error('Chargily API keys not configured')
  }

  return {
    apiKey,
    secretKey,
    mode: mode === 'live' ? 'live' : 'test',
  }
}

// Base URL factory
function getBaseUrl(mode: 'test' | 'live'): string {
  return `https://pay.chargily.net/${mode}/api/v2`
}

/**
 * Create Chargily checkout session
 */
export async function createCheckout(
  input: CheckoutCreateInput
): Promise<CheckoutResponse> {
  const config = getConfig()
  const baseUrl = getBaseUrl(config.mode)

  // Validate input
  const validated = CheckoutCreateSchema.parse(input)

  const response = await fetch(`${baseUrl}/checkouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(validated),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      `Chargily API error: ${error.message || response.statusText}`
    )
  }

  const data = await response.json()
  return CheckoutResponseSchema.parse(data)
}

/**
 * Retrieve checkout by ID
 */
export async function getCheckout(checkoutId: string): Promise<CheckoutResponse> {
  const config = getConfig()
  const baseUrl = getBaseUrl(config.mode)

  const response = await fetch(`${baseUrl}/checkouts/${checkoutId}`, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to retrieve checkout: ${response.statusText}`)
  }

  const data = await response.json()
  return CheckoutResponseSchema.parse(data)
}

/**
 * Expire checkout manually
 */
export async function expireCheckout(checkoutId: string): Promise<CheckoutResponse> {
  const config = getConfig()
  const baseUrl = getBaseUrl(config.mode)

  const response = await fetch(`${baseUrl}/checkouts/${checkoutId}/expire`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to expire checkout: ${response.statusText}`)
  }

  const data = await response.json()
  return CheckoutResponseSchema.parse(data)
}

/**
 * Verify webhook signature
 * Uses HMAC-SHA256 with timing-safe comparison
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const config = getConfig()

  const expectedSignature = createHmac('sha256', config.secretKey)
    .update(payload)
    .digest('hex')

  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

/**
 * Parse and validate webhook payload
 */
export function parseWebhookPayload(payload: string): WebhookPayload {
  const data = JSON.parse(payload)
  return WebhookPayloadSchema.parse(data)
}

/**
 * Build checkout URL for order
 */
export async function createOrderCheckout(params: {
  orderId: string
  amount: number
  paymentMethod: 'edahabia' | 'cib'
  description?: string
  successUrl: string
  failureUrl: string
  webhookUrl: string
}): Promise<{ checkoutId: string; checkoutUrl: string }> {
  const checkout = await createCheckout({
    amount: params.amount,
    currency: 'dzd',
    payment_method: params.paymentMethod,
    success_url: params.successUrl,
    failure_url: params.failureUrl,
    webhook_endpoint: params.webhookUrl,
    description: params.description,
    locale: 'fr',
    metadata: {
      order_id: params.orderId,
    },
  })

  return {
    checkoutId: checkout.id,
    checkoutUrl: checkout.checkout_url,
  }
}
