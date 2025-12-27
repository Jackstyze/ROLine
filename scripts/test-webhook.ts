/**
 * Chargily Webhook Test Script
 * Simulates webhook to test payment flow
 * Run with: npx tsx scripts/test-webhook.ts [orderId]
 */

import crypto from 'crypto'

const WEBHOOK_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

interface ChargilyWebhookPayload {
  id: string
  entity: 'checkout'
  livemode: boolean
  type: 'checkout.paid' | 'checkout.failed' | 'checkout.expired'
  data: {
    id: string
    status: 'paid' | 'failed' | 'expired'
    amount: number
    currency: 'dzd'
    metadata: {
      order_id: string
    }
  }
}

function createSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

async function testWebhook(orderId?: string) {
  console.log('\n🧪 Chargily Webhook Test\n')
  console.log('━'.repeat(50))

  const secretKey = process.env.CHARGILY_SECRET_KEY
  if (!secretKey) {
    console.error('❌ CHARGILY_SECRET_KEY not set')
    process.exit(1)
  }

  const testOrderId = orderId || '00000000-0000-0000-0000-000000000001'

  const payload: ChargilyWebhookPayload = {
    id: `evt_test_${Date.now()}`,
    entity: 'checkout',
    livemode: false,
    type: 'checkout.paid',
    data: {
      id: `chk_test_${Date.now()}`,
      status: 'paid',
      amount: 5000,
      currency: 'dzd',
      metadata: {
        order_id: testOrderId
      }
    }
  }

  const payloadString = JSON.stringify(payload)
  const signature = createSignature(payloadString, secretKey)

  console.log('📦 Payload:')
  console.log(JSON.stringify(payload, null, 2))
  console.log(`\n🔐 Signature: ${signature.slice(0, 16)}...`)

  const webhookEndpoint = `${WEBHOOK_URL}/api/webhooks/chargily`
  console.log(`\n🌐 Sending to: ${webhookEndpoint}`)

  try {
    const response = await fetch(webhookEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'signature': signature
      },
      body: payloadString
    })

    const responseText = await response.text()
    let responseData: unknown

    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }

    console.log(`\n📬 Response: ${response.status} ${response.statusText}`)
    console.log('Body:', JSON.stringify(responseData, null, 2))

    if (response.ok) {
      console.log('\n✅ Webhook delivered successfully!')
    } else {
      console.log('\n⚠️  Webhook returned error (may be expected for test)')
    }

  } catch (error) {
    console.error('\n❌ Failed to send webhook:', error)
    console.log('\n💡 Make sure the dev server is running: npm run dev')
    process.exit(1)
  }

  console.log('\n' + '━'.repeat(50))
  console.log('Test complete!\n')
}

// Get orderId from args
const orderId = process.argv[2]
testWebhook(orderId)
