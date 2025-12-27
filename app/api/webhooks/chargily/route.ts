/**
 * Chargily Pay Webhook Handler
 *
 * Receives payment events from Chargily
 * Verifies signature and updates order status
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  verifyWebhookSignature,
  parseWebhookPayload,
} from '@/features/payments/providers/chargily.provider'
import { markOrderAsPaid } from '@/features/orders/actions/orders.actions'
import { runInWebhookContext } from '@/shared/lib/auth/authorization'

export async function POST(request: NextRequest) {
  return runInWebhookContext(async () => {
    try {
      // Get raw body for signature verification
      const payload = await request.text()
      const signature = request.headers.get('signature')

      if (!signature) {
        console.error('Webhook: Missing signature header')
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 401 }
        )
      }

      // Verify signature
      if (!verifyWebhookSignature(payload, signature)) {
        console.error('Webhook: Invalid signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }

      // Parse and validate payload
      const event = parseWebhookPayload(payload)

      console.log(`Webhook: Received ${event.type} for checkout ${event.data.id}`)

      // Handle event types
      const metadata = event.data.metadata

      switch (event.type) {
        case 'checkout.paid': {
          const orderId = metadata?.order_id
          if (!orderId) {
            console.error('Webhook: Missing order_id in metadata')
            return NextResponse.json(
              { error: 'Missing order_id' },
              { status: 400 }
            )
          }

          // Mark order as paid (pass secret for internal verification)
          const webhookSecret = process.env.CHARGILY_SECRET_KEY || ''
          const result = await markOrderAsPaid(orderId, event.data.id, webhookSecret)
          if (!result.success) {
            console.error(`Webhook: Failed to mark order paid: ${result.error}`)
            return NextResponse.json(
              { error: result.error },
              { status: 500 }
            )
          }

          console.log(`Webhook: Order ${orderId} marked as paid`)
          break
        }

        case 'checkout.failed':
        case 'checkout.canceled':
        case 'checkout.expired': {
          // Log for monitoring, order stays pending
          const orderId = metadata?.order_id
          console.log(`Webhook: Checkout ${event.type} for order ${orderId}`)
          break
        }

        default:
          console.log(`Webhook: Unhandled event type ${event.type}`)
      }

      return NextResponse.json({ received: true })
    } catch (error) {
      console.error('Webhook error:', error)
      return NextResponse.json(
        { error: 'Webhook processing failed' },
        { status: 500 }
      )
    }
  })
}
