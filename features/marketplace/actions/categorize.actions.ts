'use server'

/**
 * AI Categorization Server Actions
 * Zero-shot product classification using mDeBERTa
 *
 * ARCHITECTURE:
 * - Uses Railway ML service for classification
 * - Explicit fallback when ML unavailable
 * - Action-based recommendations (auto_approve, suggest, manual_review)
 *
 * RULES:
 * - ZERO SILENT FAILURES: Always return explicit status
 * - Validation: All inputs via Zod schemas
 */

import {
  classify,
  isMLServiceConfigured,
  MLServiceError,
  MLServiceUnavailableError,
  type ClassifyResponse,
  type ClassifyAction,
} from '@/shared/lib/ml'

// =============================================================================
// TYPES
// =============================================================================

export type CategorySuggestion = {
  categoryId: number | null
  categoryName: string | null
  categoryNameAr: string | null
  confidence: number
  action: ClassifyAction | 'unavailable'
  alternatives: Array<{
    categoryId: number
    categoryName: string
    categoryNameAr: string | null
    confidence: number
  }>
  error: string | null
  processingTimeMs: number
}

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Suggest category for product title/description
 *
 * @param title - Product title
 * @param description - Optional product description
 * @returns Category suggestion with confidence and action
 */
export async function suggestCategory(
  title: string,
  description?: string
): Promise<CategorySuggestion> {
  const startTime = performance.now()

  // Check if ML service is configured
  if (!isMLServiceConfigured()) {
    return {
      categoryId: null,
      categoryName: null,
      categoryNameAr: null,
      confidence: 0,
      action: 'unavailable',
      alternatives: [],
      error: 'ML service not configured - please select category manually',
      processingTimeMs: performance.now() - startTime,
    }
  }

  // Build classification text
  const text = description ? `${title}. ${description}` : title

  if (text.trim().length < 3) {
    return {
      categoryId: null,
      categoryName: null,
      categoryNameAr: null,
      confidence: 0,
      action: 'manual_review',
      alternatives: [],
      error: 'Text too short for classification',
      processingTimeMs: performance.now() - startTime,
    }
  }

  try {
    const response = await classify({
      text: text.slice(0, 1000), // Limit text length
      top_k: 5,
      auto_approve_threshold: 0.85,
      suggest_threshold: 0.5,
    })

    const recommended = response.recommended_category
    const alternatives = response.predictions
      .slice(1) // Skip first (recommended)
      .map((p) => ({
        categoryId: p.category_id,
        categoryName: p.category_name,
        categoryNameAr: p.category_name_ar,
        confidence: p.confidence,
      }))

    return {
      categoryId: recommended.category_id,
      categoryName: recommended.category_name,
      categoryNameAr: recommended.category_name_ar,
      confidence: recommended.confidence,
      action: response.action,
      alternatives,
      error: null,
      processingTimeMs: response.processing_time_ms,
    }
  } catch (error) {
    console.error('[CATEGORIZE] ML classification failed:', error)

    // Explicit fallback response
    const errorMessage =
      error instanceof MLServiceUnavailableError
        ? 'ML service unavailable - please select category manually'
        : error instanceof MLServiceError
          ? `Classification failed: ${error.message}`
          : 'Classification error - please select category manually'

    return {
      categoryId: null,
      categoryName: null,
      categoryNameAr: null,
      confidence: 0,
      action: 'unavailable',
      alternatives: [],
      error: errorMessage,
      processingTimeMs: performance.now() - startTime,
    }
  }
}

/**
 * Batch suggest categories for multiple products
 *
 * @param items - Array of {title, description?}
 * @returns Array of category suggestions
 */
export async function suggestCategoriesBatch(
  items: Array<{ title: string; description?: string }>
): Promise<CategorySuggestion[]> {
  // Process sequentially to avoid rate limits
  const results: CategorySuggestion[] = []

  for (const item of items) {
    const result = await suggestCategory(item.title, item.description)
    results.push(result)
  }

  return results
}

/**
 * Check if category suggestion should be auto-applied
 */
export function shouldAutoApply(suggestion: CategorySuggestion): boolean {
  return suggestion.action === 'auto_approve' && suggestion.categoryId !== null
}

/**
 * Check if category needs manual review
 */
export function needsManualReview(suggestion: CategorySuggestion): boolean {
  return (
    suggestion.action === 'manual_review' ||
    suggestion.action === 'unavailable' ||
    suggestion.categoryId === null
  )
}
