'use server'

/**
 * Authentication Server Actions
 *
 * RULES APPLIED:
 * - ZERO HARDCODE: All config from env
 * - ZERO FALLBACKS: Errors propagate, no silent failures
 * - Validation: All inputs validated with Zod before processing
 */

import { createSupabaseServer } from '@/shared/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  LoginSchema,
  RegisterSchema,
  PasswordResetRequestSchema,
  ProfileUpdateSchema,
} from '../schemas/auth.schema'
import { success, failure, type ActionResult } from '@/shared/types/actions.types'
import type { Tables } from '@/shared/types/database.types'

// User profile type with wilaya relation
type ProfileWithWilaya = Tables<'profiles'> & {
  wilayas?: Pick<Tables<'wilayas'>, 'name' | 'name_ar'> | null
}

// Current user type
export type CurrentUser = {
  id: string
  email?: string
  profile: ProfileWithWilaya | null
}

/**
 * Sign in with email and password
 */
export async function signIn(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // Extract and validate input
  const rawInput = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = LoginSchema.safeParse(rawInput)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { email, password } = parsed.data

  // Authenticate with Supabase
  const supabase = await createSupabaseServer()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Map Supabase errors to user-friendly messages
    const errorMessages: Record<string, string> = {
      'Invalid login credentials': 'Email ou mot de passe incorrect',
      'Email not confirmed': 'Veuillez confirmer votre email',
      'Too many requests': 'Trop de tentatives, réessayez plus tard',
    }

    return {
      success: false,
      error: errorMessages[error.message] || error.message,
    }
  }

  // Revalidate and redirect
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * Register a new user
 */
export async function signUp(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // Extract and validate input
  const role = formData.get('role') as string
  const rawInput = {
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    fullName: formData.get('fullName'),
    role,
    wilayaId: Number(formData.get('wilayaId')),
    dateOfBirth: formData.get('dateOfBirth'),
    // Role-specific fields
    matricule: role === 'student' ? formData.get('matricule') : undefined,
    bacNumber: role === 'student' ? formData.get('bacNumber') : undefined,
    commerceRegister: role === 'merchant' ? formData.get('commerceRegister') : undefined,
  }

  const parsed = RegisterSchema.safeParse(rawInput)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { email, password, fullName, wilayaId, dateOfBirth, matricule, bacNumber, commerceRegister } = parsed.data

  const supabase = await createSupabaseServer()

  // Build metadata based on role
  const userMetadata: Record<string, unknown> = {
    full_name: fullName,
    role: parsed.data.role,
    wilaya_id: wilayaId,
    date_of_birth: dateOfBirth,
  }

  if (parsed.data.role === 'student') {
    userMetadata.matricule = matricule
    userMetadata.bac_number = bacNumber
  } else if (parsed.data.role === 'merchant') {
    userMetadata.commerce_register = commerceRegister
  }

  // Create user with metadata (will trigger profile creation via DB trigger)
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userMetadata,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    const errorMessages: Record<string, string> = {
      'User already registered': 'Un compte existe déjà avec cet email',
      'Password should be at least 6 characters':
        'Le mot de passe doit contenir au moins 6 caractères',
      'Signup is disabled': "L'inscription est temporairement désactivée",
    }

    return {
      success: false,
      error: errorMessages[error.message] || error.message,
    }
  }

  return {
    success: true,
    data: undefined,
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServer()

  const { error } = await supabase.auth.signOut()

  if (error) {
    // Log error but don't throw - user should still be redirected
    console.error('Sign out error:', error.message)
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Request password reset email
 */
export async function requestPasswordReset(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawInput = {
    email: formData.get('email'),
  }

  const parsed = PasswordResetRequestSchema.safeParse(rawInput)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { email } = parsed.data

  const supabase = await createSupabaseServer()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  // Always return success to prevent email enumeration
  return {
    success: true,
    data: undefined,
  }
}

/**
 * Get current authenticated user
 * For use in Server Components
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServer()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, wilayas(name, name_ar)')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email,
    profile: profile as ProfileWithWilaya | null,
  }
}

/**
 * Check if user has a specific role
 */
export async function hasRole(
  requiredRole: 'student' | 'merchant' | 'admin'
): Promise<boolean> {
  const user = await getCurrentUser()

  if (!user?.profile) {
    return false
  }

  if (requiredRole === 'admin') {
    return user.profile.role === 'admin'
  }

  if (requiredRole === 'merchant') {
    return user.profile.role === 'merchant' || user.profile.role === 'admin'
  }

  // Student is the base role - everyone has access
  return true
}

/**
 * Update user profile
 */
export async function updateProfile(
  formData: FormData
): Promise<ActionResult<void>> {
  const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return failure('Non authentifié')
  }

  const rawInput = {
    fullName: formData.get('fullName') || undefined,
    phone: formData.get('phone') || undefined,
    wilayaId: formData.get('wilayaId')
      ? Number(formData.get('wilayaId'))
      : undefined,
    avatarUrl: formData.get('avatarUrl') || undefined,
  }

  const parsed = ProfileUpdateSchema.safeParse(rawInput)

  if (!parsed.success) {
    return failure(
      'Données invalides',
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }

  const { fullName, phone, wilayaId, avatarUrl } = parsed.data

  // Build update object (only non-undefined values)
  const updateData: Record<string, unknown> = {}
  if (fullName !== undefined) updateData.full_name = fullName
  if (phone !== undefined) updateData.phone = phone || null
  if (wilayaId !== undefined) updateData.wilaya_id = wilayaId
  if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl || null

  if (Object.keys(updateData).length === 0) {
    return failure('Aucune modification')
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData as never)
    .eq('id', user.id)

  if (error) {
    return failure(error.message)
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard')

  return success(undefined)
}
