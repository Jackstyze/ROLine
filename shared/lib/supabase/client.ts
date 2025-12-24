/**
 * Supabase Browser Client Factory
 * Use this in Client Components ('use client')
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/shared/types/database.types'

let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createSupabaseBrowser() {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

  return client
}
