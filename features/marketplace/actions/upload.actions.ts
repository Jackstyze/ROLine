'use server'

/**
 * Image Upload Server Actions
 */

import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import { isMerchantOrAdmin } from '@/shared/lib/auth/authorization'
import { uploadImage, deleteImage } from '@/shared/lib/storage/images'
import { success, failure, type ActionResult } from '@/shared/types/actions.types'

export type UploadedImage = {
  url: string
  path: string
}

/**
 * Validate image path ownership
 * Prevents path traversal attacks
 */
function validateImagePath(path: string, userId: string): boolean {
  // Normalize path to prevent traversal
  const normalizedPath = path.replace(/\\/g, '/').replace(/\.{2,}/g, '')

  // Expected prefix for user's images
  const expectedPrefix = `products/${userId}/`

  // Must start exactly with the user's folder
  return normalizedPath.startsWith(expectedPrefix)
}

/**
 * Upload product image
 */
export async function uploadProductImage(
  formData: FormData
): Promise<ActionResult<UploadedImage>> {
  const user = await getCurrentUser()

  if (!user) {
    return failure('Non authentifié')
  }

  if (!isMerchantOrAdmin(user)) {
    return failure('Seuls les marchands peuvent uploader des images')
  }

  const file = formData.get('file') as File | null

  if (!file) {
    return failure('Aucun fichier fourni')
  }

  try {
    const result = await uploadImage(file, `products/${user.id}`)
    return success(result)
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : 'Échec upload'
    )
  }
}

/**
 * Delete product image
 */
export async function deleteProductImage(
  path: string
): Promise<ActionResult<void>> {
  const user = await getCurrentUser()

  if (!user) {
    return failure('Non authentifié')
  }

  // Validate path to prevent traversal attacks
  if (!validateImagePath(path, user.id)) {
    return failure('Non autorisé à supprimer cette image')
  }

  try {
    await deleteImage(path)
    return success(undefined)
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : 'Échec suppression'
    )
  }
}
