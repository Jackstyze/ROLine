/**
 * Safe JSON Utilities
 * Prevents crashes from malformed JSON
 */

import { z } from 'zod'

/**
 * Safely parse JSON with fallback
 * Returns default value if parsing fails
 */
export function safeJsonParse<T>(
  json: string | null | undefined,
  defaultValue: T
): T {
  if (!json) return defaultValue

  try {
    return JSON.parse(json) as T
  } catch {
    return defaultValue
  }
}

/**
 * Parse JSON with Zod validation
 * Returns null if parsing or validation fails
 */
export function parseJsonWithSchema<T>(
  json: string | null | undefined,
  schema: z.ZodSchema<T>
): T | null {
  if (!json) return null

  try {
    const parsed = JSON.parse(json)
    const result = schema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

/**
 * Parse JSON array of strings safely
 * Returns empty array on failure
 */
export function parseStringArray(json: string | null | undefined): string[] {
  return safeJsonParse(json, [])
}
