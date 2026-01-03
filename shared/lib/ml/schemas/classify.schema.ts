/**
 * ML Classification Schemas
 * Mirrors Python Pydantic schemas for type safety
 */

import { z } from 'zod'

// =============================================================================
// REQUEST SCHEMAS
// =============================================================================

export const ClassifyRequestSchema = z.object({
  text: z.string().min(3).max(1000),
  top_k: z.number().int().min(1).max(10).default(3),
  auto_approve_threshold: z.number().min(0.5).max(1).default(0.85),
  suggest_threshold: z.number().min(0.2).max(0.85).default(0.5),
})

export type ClassifyRequest = z.infer<typeof ClassifyRequestSchema>

// =============================================================================
// RESPONSE SCHEMAS
// =============================================================================

export const ClassifyActionSchema = z.enum([
  'auto_approve',
  'suggest',
  'manual_review',
])

export type ClassifyAction = z.infer<typeof ClassifyActionSchema>

export const CategoryPredictionSchema = z.object({
  category_id: z.number().int().positive(),
  category_name: z.string(),
  category_name_ar: z.string().nullable(),
  confidence: z.number().min(0).max(1),
})

export type CategoryPrediction = z.infer<typeof CategoryPredictionSchema>

export const ClassifyResponseSchema = z.object({
  predictions: z.array(CategoryPredictionSchema).min(1),
  recommended_category: CategoryPredictionSchema,
  action: ClassifyActionSchema,
  processing_time_ms: z.number().nonnegative(),
})

export type ClassifyResponse = z.infer<typeof ClassifyResponseSchema>

// =============================================================================
// BATCH SCHEMAS
// =============================================================================

export const ClassifyBatchRequestSchema = z.object({
  texts: z.array(z.string().min(3)).min(1).max(50),
  top_k: z.number().int().min(1).max(10).default(3),
  auto_approve_threshold: z.number().min(0.5).max(1).default(0.85),
  suggest_threshold: z.number().min(0.2).max(0.85).default(0.5),
})

export type ClassifyBatchRequest = z.infer<typeof ClassifyBatchRequestSchema>

export const ClassifyBatchResponseSchema = z.object({
  results: z.array(ClassifyResponseSchema),
  total_processing_time_ms: z.number().nonnegative(),
})

export type ClassifyBatchResponse = z.infer<typeof ClassifyBatchResponseSchema>
