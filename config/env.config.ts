/**
 * Environment Configuration - ZERO HARDCODE
 * All environment variables validated with Zod at startup
 * Application fails fast if any required variable is missing
 */

import { z } from 'zod'

const envSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url({
    message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL',
  }),
  SUPABASE_ANON_KEY: z.string().min(1, {
    message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required',
  }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, {
    message: 'SUPABASE_SERVICE_ROLE_KEY is required (server-side only)',
  }),

  // Site
  SITE_URL: z.string().url({
    message: 'NEXT_PUBLIC_SITE_URL must be a valid URL',
  }),

  // Chargily Pay (optional during development)
  CHARGILY_SECRET_KEY: z.string().optional(),
  CHARGILY_PUBLIC_KEY: z.string().optional(),
})

// Type inference from schema
export type EnvConfig = z.infer<typeof envSchema>

// Parse and validate - FAIL FAST if invalid
function validateEnv(): EnvConfig {
  const parsed = envSchema.safeParse({
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    CHARGILY_SECRET_KEY: process.env.CHARGILY_SECRET_KEY,
    CHARGILY_PUBLIC_KEY: process.env.NEXT_PUBLIC_CHARGILY_PUBLIC_KEY,
  })

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `  ${field}: ${messages?.join(', ')}`)
      .join('\n')

    throw new Error(
      `Environment validation failed:\n${errorMessages}\n\nCheck your .env.local file.`
    )
  }

  return parsed.data
}

// Export validated config - will throw on import if invalid
export const envConfig = validateEnv()
