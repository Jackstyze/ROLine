/**
 * Authentication Schemas - Zod validation
 * All auth inputs validated before processing
 */

import { z } from 'zod'

// Email validation (strict)
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .toLowerCase()
  .trim()

// Password validation (secure)
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

// Phone validation (Algerian format)
const phoneSchema = z
  .string()
  .regex(
    /^(\+213|0)(5|6|7)[0-9]{8}$/,
    'Invalid Algerian phone number (ex: 0555123456 or +213555123456)'
  )

// Login schema
export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof LoginSchema>

// Register schema
export const RegisterSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    fullName: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name too long'),
    role: z.enum(['student', 'merchant'], {
      errorMap: () => ({ message: 'Select a valid role' }),
    }),
    wilayaId: z
      .number()
      .int()
      .min(1, 'Select a wilaya')
      .max(58, 'Invalid wilaya'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof RegisterSchema>

// Profile update schema
export const ProfileUpdateSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .optional(),
  phone: phoneSchema.optional().or(z.literal('')),
  wilayaId: z.number().int().min(1).max(58).optional(),
  avatarUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
})

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>

// Password reset request
export const PasswordResetRequestSchema = z.object({
  email: emailSchema,
})

export type PasswordResetRequestInput = z.infer<
  typeof PasswordResetRequestSchema
>

// Password reset confirm
export const PasswordResetConfirmSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type PasswordResetConfirmInput = z.infer<
  typeof PasswordResetConfirmSchema
>
