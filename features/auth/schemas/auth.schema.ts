/**
 * Authentication Schemas - Zod validation
 * All auth inputs validated before processing
 */

import { z } from 'zod'
import {
  WILAYA_MIN,
  WILAYA_MAX,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from '@/shared/constants/limits'

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
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .max(MAX_PASSWORD_LENGTH, 'Password too long')
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

// Date of birth validation (18+ years)
const dateOfBirthSchema = z
  .string()
  .min(1, 'Date de naissance requise')
  .refine((date) => {
    const birthDate = new Date(date)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ? age - 1
      : age
    return actualAge >= 18
  }, 'Vous devez avoir au moins 18 ans')

// Student matricule
const matriculeSchema = z
  .string()
  .min(5, 'Matricule invalide')
  .max(20, 'Matricule trop long')

// BAC number
const bacNumberSchema = z
  .string()
  .min(5, 'Numéro BAC invalide')
  .max(20, 'Numéro BAC trop long')

// Commerce register number
const commerceRegisterSchema = z
  .string()
  .min(5, 'Numéro registre commerce invalide')
  .max(30, 'Numéro registre commerce trop long')

// Login schema
export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof LoginSchema>

// Register schema base
const registerBaseSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long'),
  role: z.enum(['student', 'merchant'], {
    message: 'Select a valid role',
  }),
  wilayaId: z
    .number()
    .int()
    .min(WILAYA_MIN, 'Select a wilaya')
    .max(WILAYA_MAX, 'Invalid wilaya'),
  dateOfBirth: dateOfBirthSchema,
  // Student-specific fields (optional, validated in superRefine)
  matricule: z.string().optional(),
  bacNumber: z.string().optional(),
  // Merchant-specific fields (optional, validated in superRefine)
  commerceRegister: z.string().optional(),
  // Document scan disabled for MVP
  // commerceRegisterDocument: z.string().optional(),
})

// Register schema with conditional validation
export const RegisterSchema = registerBaseSchema
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .superRefine((data, ctx) => {
    // Student-specific validation
    if (data.role === 'student') {
      if (!data.matricule || data.matricule.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Matricule étudiant requis (min 5 caractères)',
          path: ['matricule'],
        })
      }
      if (!data.bacNumber || data.bacNumber.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Numéro BAC requis (min 5 caractères)',
          path: ['bacNumber'],
        })
      }
    }
    // Merchant-specific validation
    if (data.role === 'merchant') {
      if (!data.commerceRegister || data.commerceRegister.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Numéro registre commerce requis (min 5 caractères)',
          path: ['commerceRegister'],
        })
      }
    }
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
  wilayaId: z.number().int().min(WILAYA_MIN).max(WILAYA_MAX).optional(),
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
