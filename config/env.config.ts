/**
 * Environment Configuration - ZERO HARDCODE
 *
 * Pattern: Lazy Validation with Proxy
 * - Development: Validates only when variables are accessed
 * - Production: Validates all required variables at build time
 *
 * This allows initial setup without immediate crashes while
 * maintaining strict validation when variables are actually used.
 */

import { z } from 'zod'

// Schema for all environment variables
const envSchema = z.object({
  // Supabase (required for core functionality)
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

  // Chargily Pay (required for payments)
  CHARGILY_API_KEY: z.string().optional(),
  CHARGILY_SECRET_KEY: z.string().optional(),
  CHARGILY_MODE: z.enum(['test', 'live']).optional(),

  // Cohere API (for semantic search embeddings)
  COHERE_API_KEY: z.string().min(1, {
    message: 'COHERE_API_KEY is required for semantic search',
  }).optional(),

  // ML Service (Railway - for classification and recommendations)
  ML_SERVICE_URL: z.string().url({
    message: 'ML_SERVICE_URL must be a valid URL',
  }).optional(),
  ML_SERVICE_API_KEY: z.string().min(1, {
    message: 'ML_SERVICE_API_KEY is required for ML service auth',
  }).optional(),
})

// Type inference
export type EnvConfig = z.infer<typeof envSchema>

// Individual field schemas for lazy validation
const fieldSchemas: Record<keyof EnvConfig, z.ZodTypeAny> = {
  SUPABASE_URL: envSchema.shape.SUPABASE_URL,
  SUPABASE_ANON_KEY: envSchema.shape.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: envSchema.shape.SUPABASE_SERVICE_ROLE_KEY,
  SITE_URL: envSchema.shape.SITE_URL,
  CHARGILY_API_KEY: envSchema.shape.CHARGILY_API_KEY,
  CHARGILY_SECRET_KEY: envSchema.shape.CHARGILY_SECRET_KEY,
  CHARGILY_MODE: envSchema.shape.CHARGILY_MODE,
  COHERE_API_KEY: envSchema.shape.COHERE_API_KEY,
  ML_SERVICE_URL: envSchema.shape.ML_SERVICE_URL,
  ML_SERVICE_API_KEY: envSchema.shape.ML_SERVICE_API_KEY,
}

// Mapping from our config keys to actual env var names
const envVarMapping: Record<keyof EnvConfig, string> = {
  SUPABASE_URL: 'NEXT_PUBLIC_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  SUPABASE_SERVICE_ROLE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
  SITE_URL: 'NEXT_PUBLIC_SITE_URL',
  CHARGILY_API_KEY: 'CHARGILY_API_KEY',
  CHARGILY_SECRET_KEY: 'CHARGILY_SECRET_KEY',
  CHARGILY_MODE: 'CHARGILY_MODE',
  COHERE_API_KEY: 'COHERE_API_KEY',
  ML_SERVICE_URL: 'ML_SERVICE_URL',
  ML_SERVICE_API_KEY: 'ML_SERVICE_API_KEY',
}

// Cache for validated values
const validatedCache = new Map<string, unknown>()

/**
 * Lazy validation proxy
 * Validates each environment variable only when accessed
 */
function createLazyEnvConfig(): EnvConfig {
  return new Proxy({} as EnvConfig, {
    get(_, prop: string) {
      const key = prop as keyof EnvConfig

      // Return cached value if already validated
      if (validatedCache.has(key)) {
        return validatedCache.get(key)
      }

      // Get the actual env var name and value
      const envVarName = envVarMapping[key]
      if (!envVarName) {
        throw new Error(`Unknown environment variable: ${key}`)
      }

      const rawValue = process.env[envVarName]

      // Get the schema for this field
      const schema = fieldSchemas[key]
      if (!schema) {
        throw new Error(`No schema defined for: ${key}`)
      }

      // Validate
      const result = schema.safeParse(rawValue)

      if (!result.success) {
        const errorMessage = result.error.issues
          .map((e: { message: string }) => e.message)
          .join(', ')

        throw new Error(
          `Environment variable ${envVarName} is invalid: ${errorMessage}\n` +
            `Current value: ${rawValue ? `"${rawValue.slice(0, 20)}..."` : 'undefined'}\n` +
            `Check your .env.local file.`
        )
      }

      // Cache and return
      validatedCache.set(key, result.data)
      return result.data
    },

    // Prevent setting values
    set() {
      throw new Error('Environment config is read-only')
    },

    // For Object.keys() support
    ownKeys() {
      return Object.keys(envVarMapping)
    },

    getOwnPropertyDescriptor(_, prop) {
      if (prop in envVarMapping) {
        return {
          enumerable: true,
          configurable: true,
        }
      }
      return undefined
    },
  })
}

/**
 * Full validation (for production builds)
 * Call this in next.config.ts to validate all required vars at build time
 */
export function validateAllEnvVars(): void {
  const rawEnv = {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    CHARGILY_API_KEY: process.env.CHARGILY_API_KEY,
    CHARGILY_SECRET_KEY: process.env.CHARGILY_SECRET_KEY,
    CHARGILY_MODE: process.env.CHARGILY_MODE,
    COHERE_API_KEY: process.env.COHERE_API_KEY,
    ML_SERVICE_URL: process.env.ML_SERVICE_URL,
    ML_SERVICE_API_KEY: process.env.ML_SERVICE_API_KEY,
  }

  const result = envSchema.safeParse(rawEnv)

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => {
        const envVar = envVarMapping[field as keyof EnvConfig]
        return `  ${envVar}: ${messages?.join(', ')}`
      })
      .join('\n')

    throw new Error(
      `\n❌ Environment validation failed:\n${errorMessages}\n\n` +
        `Create a .env.local file with the required variables.\n` +
        `See .env.example for reference.\n`
    )
  }

  console.log('✅ Environment variables validated successfully')
}

// Export the lazy config
export const envConfig = createLazyEnvConfig()

// Also export individual getters for specific use cases
export const getSupabaseUrl = () => envConfig.SUPABASE_URL
export const getSupabaseAnonKey = () => envConfig.SUPABASE_ANON_KEY
export const getSupabaseServiceRoleKey = () => envConfig.SUPABASE_SERVICE_ROLE_KEY
export const getSiteUrl = () => envConfig.SITE_URL
export const getCohereApiKey = () => envConfig.COHERE_API_KEY
export const getMLServiceUrl = () => envConfig.ML_SERVICE_URL
export const getMLServiceApiKey = () => envConfig.ML_SERVICE_API_KEY
