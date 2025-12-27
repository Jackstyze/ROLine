/**
 * Environment Verification Script
 * Run with: npx tsx scripts/check-env.ts
 */

import { createClient } from '@supabase/supabase-js'

const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CHARGILY_API_KEY',
  'CHARGILY_SECRET_KEY',
] as const

const OPTIONAL_ENV = [
  'NEXT_PUBLIC_SITE_URL',
  'CHARGILY_MODE',
] as const

async function checkEnv() {
  console.log('\n🔍 ROLine V0 - Environment Check\n')
  console.log('━'.repeat(50))

  // Check required variables
  const missing: string[] = []
  const present: string[] = []

  for (const key of REQUIRED_ENV) {
    if (process.env[key]) {
      present.push(key)
    } else {
      missing.push(key)
    }
  }

  console.log('\n📋 Required Variables:')
  for (const key of present) {
    const value = process.env[key]!
    const masked = key.includes('KEY')
      ? `${value.slice(0, 8)}...${value.slice(-4)}`
      : value.slice(0, 40) + (value.length > 40 ? '...' : '')
    console.log(`  ✅ ${key}: ${masked}`)
  }

  for (const key of missing) {
    console.log(`  ❌ ${key}: MISSING`)
  }

  // Check optional variables
  console.log('\n📋 Optional Variables:')
  for (const key of OPTIONAL_ENV) {
    const value = process.env[key]
    if (value) {
      console.log(`  ✅ ${key}: ${value}`)
    } else {
      console.log(`  ⚠️  ${key}: Not set (using default)`)
    }
  }

  if (missing.length > 0) {
    console.log(`\n❌ Missing ${missing.length} required variable(s)`)
    console.log('   Create .env.local with required values from SETUP.md')
    process.exit(1)
  }

  // Test Supabase connection
  console.log('\n🔌 Testing Supabase Connection...')

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check tables
    const tables = ['profiles', 'products', 'orders', 'wilayas', 'categories']
    const results: Record<string, boolean> = {}

    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1)
      results[table] = !error
    }

    console.log('\n📊 Database Tables:')
    for (const [table, exists] of Object.entries(results)) {
      console.log(`  ${exists ? '✅' : '❌'} ${table}`)
    }

    // Check wilayas count
    const { count } = await supabase
      .from('wilayas')
      .select('*', { count: 'exact', head: true })

    console.log(`\n📍 Wilayas loaded: ${count ?? 0}/69`)

    // Check categories count
    const { count: catCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })

    console.log(`📂 Categories loaded: ${catCount ?? 0}`)

    // Check RPC function
    const { error: rpcError } = await supabase.rpc('create_order_atomic', {
      p_buyer_id: '00000000-0000-0000-0000-000000000000',
      p_product_id: '00000000-0000-0000-0000-000000000000',
      p_payment_method: 'cod',
      p_shipping_address: 'test',
      p_shipping_wilaya: 1,
      p_notes: null,
      p_total_amount: 0
    })

    // Expected to fail (invalid UUIDs) but function should exist
    const rpcExists = !rpcError || !rpcError.message.includes('function')
    console.log(`\n⚡ RPC create_order_atomic: ${rpcExists ? '✅ Ready' : '❌ Missing (run migration 002)'}`)

    console.log('\n' + '━'.repeat(50))
    console.log('✅ Environment verification complete!\n')

  } catch (error) {
    console.error('\n❌ Supabase connection failed:', error)
    process.exit(1)
  }
}

checkEnv()
