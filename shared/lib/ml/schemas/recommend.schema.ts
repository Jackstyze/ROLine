/**
 * ML Recommendation Schemas
 * Mirrors Python Pydantic schemas for type safety
 */

import { z } from 'zod'

// =============================================================================
// REQUEST SCHEMAS
// =============================================================================

export const RecommendRequestSchema = z.object({
  user_id: z.string().min(1),
  entity_types: z.array(z.enum(['product', 'event', 'coupon'])).default(['product']),
  limit: z.number().int().min(1).max(50).default(10),
  exclude_ids: z.array(z.string()).default([]),
  category_filter: z.number().int().positive().optional(),
  wilaya_filter: z.number().int().min(1).max(69).optional(),
})

export type RecommendRequest = z.infer<typeof RecommendRequestSchema>

// =============================================================================
// RESPONSE SCHEMAS
// =============================================================================

export const RecommendationSchema = z.object({
  item_id: z.string(),
  entity_type: z.enum(['product', 'event', 'coupon']),
  score: z.number(),
  reason: z.string(),
})

export type Recommendation = z.infer<typeof RecommendationSchema>

export const RecommendResponseSchema = z.object({
  recommendations: z.array(RecommendationSchema),
  user_id: z.string(),
  model_version: z.string(),
  is_cold_start: z.boolean(),
  fallback_used: z.boolean(),
  processing_time_ms: z.number().nonnegative(),
})

export type RecommendResponse = z.infer<typeof RecommendResponseSchema>

// =============================================================================
// TRAINING SCHEMAS
// =============================================================================

export const TrainRequestSchema = z.object({
  epochs: z.number().int().min(5).max(100).optional(),
  force: z.boolean().default(false),
})

export type TrainRequest = z.infer<typeof TrainRequestSchema>

export const TrainResponseSchema = z.object({
  success: z.boolean(),
  model_version: z.string(),
  metrics: z.record(z.unknown()),
  num_users: z.number().int().nonnegative(),
  num_items: z.number().int().nonnegative(),
  num_interactions: z.number().int().nonnegative(),
  training_time_seconds: z.number().nonnegative(),
  error: z.string().nullable(),
})

export type TrainResponse = z.infer<typeof TrainResponseSchema>
