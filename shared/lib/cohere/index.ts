/**
 * Cohere Embeddings Module
 * Re-exports for clean imports
 */

export {
  embedTexts,
  embedQuery,
  embedDocuments,
  embedBatch,
  isCohereConfigured,
  cosineSimilarity,
  COHERE_CONSTANTS,
  type EmbedInputType,
  type EmbedResponse,
} from './client'
