/**
 * Authorization Helpers
 * Centralized role and permission checks
 */

import { AsyncLocalStorage } from 'async_hooks'
import type { CurrentUser } from '@/features/auth/actions/auth.actions'

/**
 * Check if user has merchant or admin role
 */
export function isMerchantOrAdmin(user: CurrentUser | null): boolean {
  if (!user?.profile) return false
  return user.profile.role === 'merchant' || user.profile.role === 'admin'
}

/**
 * Check if user is admin
 */
export function isAdmin(user: CurrentUser | null): boolean {
  if (!user?.profile) return false
  return user.profile.role === 'admin'
}

/**
 * Check if user owns a resource by ID
 */
export function isOwner(user: CurrentUser | null, ownerId: string): boolean {
  if (!user) return false
  return user.id === ownerId
}

/**
 * Webhook context using AsyncLocalStorage
 * Thread-safe alternative to global mutable state
 */
type WebhookContextStore = { isWebhook: boolean }
const webhookContextStorage = new AsyncLocalStorage<WebhookContextStore>()

/**
 * Run callback within webhook context
 * Use this in webhook handlers to mark operations as webhook-initiated
 */
export function runInWebhookContext<T>(callback: () => T): T {
  return webhookContextStorage.run({ isWebhook: true }, callback)
}

/**
 * Check if current execution is within webhook context
 */
export function isWebhookContext(): boolean {
  const store = webhookContextStorage.getStore()
  return store?.isWebhook ?? false
}

/**
 * Require authentication - throws if not authenticated
 */
export function requireAuth(user: CurrentUser | null): asserts user is CurrentUser {
  if (!user) {
    throw new Error('Authentication required')
  }
}

/**
 * Require merchant role - throws if not merchant or admin
 */
export function requireMerchant(user: CurrentUser | null): asserts user is CurrentUser {
  requireAuth(user)
  if (!isMerchantOrAdmin(user)) {
    throw new Error('Merchant role required')
  }
}
