/**
 * Image Upload Service
 * Handles image uploads to Supabase Storage
 *
 * RULES:
 * - ZERO HARDCODE: Bucket name from config
 * - ZERO FALLBACKS: Errors thrown on failure
 */

import { createSupabaseServer } from '@/shared/lib/supabase/server'

const BUCKET_NAME = 'products' // Configured in Supabase dashboard
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export type UploadResult = {
  url: string
  path: string
}

/**
 * Upload a single image to Supabase Storage
 */
export async function uploadImage(
  file: File,
  folder: string = 'products'
): Promise<UploadResult> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `Type de fichier non supporté: ${file.type}. Utilisez JPEG, PNG ou WebP.`
    )
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `Fichier trop volumineux: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: 5MB.`
    )
  }

  const supabase = await createSupabaseServer()

  // Generate unique filename
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const fileName = `${folder}/${timestamp}-${random}.${ext}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Échec upload: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path)

  return {
    url: urlData.publicUrl,
    path: data.path,
  }
}

/**
 * Upload multiple images
 */
export async function uploadImages(
  files: File[],
  folder: string = 'products'
): Promise<UploadResult[]> {
  if (files.length > 5) {
    throw new Error('Maximum 5 images autorisées')
  }

  const results = await Promise.all(
    files.map((file) => uploadImage(file, folder))
  )

  return results
}

/**
 * Delete an image from storage
 */
export async function deleteImage(path: string): Promise<void> {
  const supabase = await createSupabaseServer()

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path])

  if (error) {
    throw new Error(`Échec suppression: ${error.message}`)
  }
}

/**
 * Delete multiple images
 */
export async function deleteImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return

  const supabase = await createSupabaseServer()

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(paths)

  if (error) {
    throw new Error(`Échec suppression: ${error.message}`)
  }
}
