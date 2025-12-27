/**
 * Event Schemas - Zod validation
 * All event inputs validated before database operations
 */

import { z } from 'zod'
import {
  WILAYA_MIN,
  WILAYA_MAX,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from '@/shared/constants/limits'

// Event create schema
export const EventCreateSchema = z.object({
  title: z
    .string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(MAX_TITLE_LENGTH, 'Titre trop long')
    .trim(),
  titleAr: z.string().max(MAX_TITLE_LENGTH, 'Titre arabe trop long').optional().nullable(),
  description: z.string().max(MAX_DESCRIPTION_LENGTH, 'Description trop longue').optional().nullable(),
  categoryId: z.number().int().positive('Sélectionnez une catégorie').optional().nullable(),
  startDate: z.coerce.date({ error: 'Date de début requise' }),
  endDate: z.coerce.date().optional().nullable(),
  locationName: z.string().min(1, 'Lieu requis').max(200, 'Nom du lieu trop long'),
  locationAddress: z.string().max(500, 'Adresse trop longue').optional().nullable(),
  wilayaId: z.number().int().min(WILAYA_MIN).max(WILAYA_MAX).optional().nullable(),
  isOnline: z.boolean().default(false),
  onlineUrl: z.string().url('URL invalide').optional().nullable(),
  isFree: z.boolean().default(true),
  price: z.number().min(0, 'Prix invalide').optional().nullable(),
  registrationUrl: z.string().url('URL inscription invalide').optional().nullable(),
  maxAttendees: z.number().int().positive().optional().nullable(),
}).refine(
  (data) => data.isOnline || data.locationName.trim().length > 0,
  { message: 'Lieu requis pour les événements en présentiel', path: ['locationName'] }
).refine(
  (data) => !data.endDate || data.endDate >= data.startDate,
  { message: 'La date de fin doit être après la date de début', path: ['endDate'] }
)

export type EventCreateInput = z.infer<typeof EventCreateSchema>

// Event update schema (all fields optional)
export const EventUpdateSchema = z.object({
  title: z.string().min(3).max(MAX_TITLE_LENGTH).trim().optional(),
  titleAr: z.string().max(MAX_TITLE_LENGTH).optional().nullable(),
  description: z.string().max(MAX_DESCRIPTION_LENGTH).optional().nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional().nullable(),
  locationName: z.string().min(1).max(200).optional(),
  locationAddress: z.string().max(500).optional().nullable(),
  wilayaId: z.number().int().min(WILAYA_MIN).max(WILAYA_MAX).optional().nullable(),
  isOnline: z.boolean().optional(),
  onlineUrl: z.string().url().optional().nullable(),
  isFree: z.boolean().optional(),
  price: z.number().min(0).optional().nullable(),
  registrationUrl: z.string().url().optional().nullable(),
  maxAttendees: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
})

export type EventUpdateInput = z.infer<typeof EventUpdateSchema>

// Event filter schema
export const EventFilterSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  wilayaId: z.number().int().min(WILAYA_MIN).max(WILAYA_MAX).optional(),
  isFree: z.boolean().optional(),
  isOnline: z.boolean().optional(),
  startAfter: z.coerce.date().optional(),
  startBefore: z.coerce.date().optional(),
})

export type EventFilterInput = z.infer<typeof EventFilterSchema>
