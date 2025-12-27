'use server'

/**
 * Notifications Server Actions
 * RULES: ZERO HARDCODE, ZERO FALLBACKS
 */

import { createSupabaseServer } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import { success, failure, type ActionResult } from '@/shared/types/actions.types'

export type NotificationType = 'order' | 'message' | 'promo' | 'system' | 'wishlist'

export type Notification = {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
}

/**
 * Get user's notifications
 */
export async function getNotifications(limit: number = 20): Promise<Notification[]> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount(): Promise<number> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return 0

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) return 0
  return count || 0
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<ActionResult<void>> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return failure('Vous devez être connecté')

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) return failure(error.message)

  revalidatePath('/dashboard')
  return success(undefined)
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<ActionResult<void>> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return failure('Vous devez être connecté')

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) return failure(error.message)

  revalidatePath('/dashboard')
  return success(undefined)
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<ActionResult<void>> {
  const supabase = await createSupabaseServer()
  const user = await getCurrentUser()

  if (!user) return failure('Vous devez être connecté')

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) return failure(error.message)

  revalidatePath('/dashboard')
  return success(undefined)
}

/**
 * Create a notification (server-side only, for use in other actions)
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  data?: Record<string, unknown>
): Promise<ActionResult<void>> {
  const supabase = await createSupabaseServer()

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      body: body || null,
      data: data || {}
    })

  if (error) return failure(error.message)
  return success(undefined)
}
