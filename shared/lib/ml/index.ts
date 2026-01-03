/**
 * ML Service Client
 * Exports for Railway-hosted ML microservice
 */

export * from './schemas'
export {
  // Classification
  classify,
  classifyBatch,
  getClassifierStatus,
  // Recommendations
  recommend,
  trainRecommender,
  getRecommenderStatus,
  // Health
  checkHealth,
  isMLServiceConfigured,
  // Errors
  MLServiceError,
  MLServiceUnavailableError,
} from './client'
