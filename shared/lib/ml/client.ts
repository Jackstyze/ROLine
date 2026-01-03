/**
 * ML Service Client
 * Connects to Railway-hosted mDeBERTa + LightFM service
 *
 * ARCHITECTURE:
 * - Factory pattern following Cohere client
 * - Explicit error handling (no silent failures)
 * - Fallback responses clearly marked
 * - Request timeout and retry logic
 *
 * USAGE:
 * - Call from server actions only (API key must not leak to client)
 * - Use classify() for product categorization
 * - Use recommend() for personalized recommendations
 */

import { envConfig } from '@/config/env.config'
import {
  ClassifyRequest,
  ClassifyResponse,
  ClassifyResponseSchema,
  ClassifyBatchRequest,
  ClassifyBatchResponse,
  ClassifyBatchResponseSchema,
  RecommendRequest,
  RecommendResponse,
  RecommendResponseSchema,
  TrainRequest,
  TrainResponse,
  TrainResponseSchema,
} from './schemas'

// =============================================================================
// CONFIGURATION
// =============================================================================

const ML_CONFIG = {
  /** Request timeout in milliseconds */
  TIMEOUT_MS: 30000,
  /** Max retries on failure */
  MAX_RETRIES: 2,
  /** Delay between retries */
  RETRY_DELAY_MS: 1000,
} as const

// =============================================================================
// ERROR TYPES
// =============================================================================

export class MLServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly endpoint?: string
  ) {
    super(message)
    this.name = 'MLServiceError'
  }
}

export class MLServiceUnavailableError extends MLServiceError {
  constructor(message: string = 'ML service unavailable') {
    super(message, 503)
    this.name = 'MLServiceUnavailableError'
  }
}

// =============================================================================
// CLIENT IMPLEMENTATION
// =============================================================================

/**
 * Check if ML service is configured
 */
export function isMLServiceConfigured(): boolean {
  return !!(envConfig.ML_SERVICE_URL && envConfig.ML_SERVICE_API_KEY)
}

/**
 * Get base URL for ML service
 */
function getBaseUrl(): string {
  const url = envConfig.ML_SERVICE_URL
  if (!url) {
    throw new MLServiceUnavailableError('ML_SERVICE_URL not configured')
  }
  return url.replace(/\/$/, '') // Remove trailing slash
}

/**
 * Get API key for ML service
 */
function getApiKey(): string {
  const key = envConfig.ML_SERVICE_API_KEY
  if (!key) {
    throw new MLServiceUnavailableError('ML_SERVICE_API_KEY not configured')
  }
  return key
}

/**
 * Make authenticated request to ML service
 */
async function mlRequest<T>(
  endpoint: string,
  options: {
    method: 'GET' | 'POST'
    body?: unknown
    retries?: number
  }
): Promise<T> {
  const baseUrl = getBaseUrl()
  const apiKey = getApiKey()
  const url = `${baseUrl}${endpoint}`
  const retries = options.retries ?? ML_CONFIG.MAX_RETRIES

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ML_CONFIG.TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorBody = await response.text()
      throw new MLServiceError(
        `ML service error: ${response.status} - ${errorBody}`,
        response.status,
        endpoint
      )
    }

    return (await response.json()) as T
  } catch (error) {
    clearTimeout(timeoutId)

    // Handle abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      if (retries > 0) {
        await sleep(ML_CONFIG.RETRY_DELAY_MS)
        return mlRequest<T>(endpoint, { ...options, retries: retries - 1 })
      }
      throw new MLServiceError(`ML service timeout after ${ML_CONFIG.TIMEOUT_MS}ms`, 408, endpoint)
    }

    // Handle network errors with retry
    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (retries > 0) {
        await sleep(ML_CONFIG.RETRY_DELAY_MS)
        return mlRequest<T>(endpoint, { ...options, retries: retries - 1 })
      }
      throw new MLServiceUnavailableError('ML service unreachable')
    }

    throw error
  }
}

// =============================================================================
// CLASSIFICATION API
// =============================================================================

/**
 * Classify text into product categories
 *
 * @param request - Classification request
 * @returns Classification response with predictions and recommended action
 * @throws MLServiceError on failure
 */
export async function classify(request: ClassifyRequest): Promise<ClassifyResponse> {
  const raw = await mlRequest<unknown>('/classify', {
    method: 'POST',
    body: request,
  })

  return ClassifyResponseSchema.parse(raw)
}

/**
 * Classify multiple texts in batch
 *
 * @param request - Batch classification request
 * @returns Batch classification response
 * @throws MLServiceError on failure
 */
export async function classifyBatch(
  request: ClassifyBatchRequest
): Promise<ClassifyBatchResponse> {
  const raw = await mlRequest<unknown>('/classify/batch', {
    method: 'POST',
    body: request,
  })

  return ClassifyBatchResponseSchema.parse(raw)
}

/**
 * Get classifier status
 */
export async function getClassifierStatus(): Promise<{
  ready: boolean
  category_count: number
}> {
  return mlRequest('/classify/status', { method: 'GET' })
}

// =============================================================================
// RECOMMENDATION API
// =============================================================================

/**
 * Get personalized recommendations for a user
 *
 * @param request - Recommendation request
 * @returns Recommendations with cold-start and fallback indicators
 * @throws MLServiceError on failure
 */
export async function recommend(request: RecommendRequest): Promise<RecommendResponse> {
  const raw = await mlRequest<unknown>('/recommend', {
    method: 'POST',
    body: request,
  })

  return RecommendResponseSchema.parse(raw)
}

/**
 * Trigger model retraining
 *
 * @param request - Training request (optional epochs override)
 * @returns Training result with metrics
 */
export async function trainRecommender(request?: TrainRequest): Promise<TrainResponse> {
  const raw = await mlRequest<unknown>('/recommend/train', {
    method: 'POST',
    body: request ?? {},
  })

  return TrainResponseSchema.parse(raw)
}

/**
 * Get recommender status
 */
export async function getRecommenderStatus(): Promise<{
  ready: boolean
  model_version: string
}> {
  return mlRequest('/recommend/status', { method: 'GET' })
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

/**
 * Check ML service health
 */
export async function checkHealth(): Promise<{
  status: string
  version: string
  services: {
    classifier: { ready: boolean; categories: number }
    recommender: { ready: boolean; model_version: string }
  }
}> {
  if (!isMLServiceConfigured()) {
    throw new MLServiceUnavailableError('ML service not configured')
  }

  return mlRequest('/health', { method: 'GET', retries: 0 })
}

// =============================================================================
// UTILITIES
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
