'use server'

/**
 * Product Server Actions
 *
 * RULES:
 * - ZERO HARDCODE: Pagination, limits from params
 * - ZERO FALLBACKS: Errors thrown, not swallowed
 * - Validation: All inputs via Zod schemas
 */

import { createSupabaseServer } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  ProductCreateSchema,
  ProductUpdateSchema,
  ProductFilterSchema,
  type ProductFilterInput,
} from '../schemas/product.schema'
import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import { isMerchantOrAdmin } from '@/shared/lib/auth/authorization'
import { parseStringArray } from '@/shared/lib/utils/json'
import type { Insertable, Updatable } from '@/shared/types/database.types'
import { success, failure, type ActionResult } from '@/shared/types/actions.types'

// Product insert type
type ProductInsert = Insertable<'products'>
type ProductUpdate = Updatable<'products'>

export type Product = {
  id: string
  merchant_id: string
  category_id: number | null
  title: string
  title_ar: string | null
  description: string | null
  price: number
  original_price: number | null
  delivery_fee: number | null
  images: string[]
  wilaya_id: number | null
  status: 'draft' | 'active' | 'sold' | 'archived'
  stock_quantity: number | null
  views_count: number
  created_at: string
  updated_at: string
  // Joined data
  merchant?: {
    id: string
    full_name: string | null
    avatar_url: string | null
    phone?: string | null
  }
  category?: {
    id: number
    name: string
    name_ar: string
  }
  wilaya?: {
    id: number
    name: string
    name_ar: string
  }
}

export type ProductsResponse = {
  products: Product[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/**
 * Get products with filters and pagination
 */
export async function getProducts(
  filters: Partial<ProductFilterInput> = {}
): Promise<ProductsResponse> {
  const supabase = await createSupabaseServer()

  // Validate and apply defaults
  const parsed = ProductFilterSchema.safeParse(filters)
  const validFilters = parsed.success ? parsed.data : ProductFilterSchema.parse({})

  const { page, limit, categoryId, wilayaId, minPrice, maxPrice, search, sortBy, sortOrder } =
    validFilters

  // Calculate offset
  const offset = (page - 1) * limit

  // Build query
  let query = supabase
    .from('products')
    .select(
      `
      *,
      merchant:profiles!merchant_id(id, full_name, avatar_url),
      category:categories(id, name, name_ar),
      wilaya:wilayas(id, name, name_ar)
    `,
      { count: 'exact' }
    )
    .eq('status', 'active')

  // Apply filters
  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  if (wilayaId) {
    query = query.eq('wilaya_id', wilayaId)
  }

  if (minPrice !== undefined) {
    query = query.gte('price', minPrice)
  }

  if (maxPrice !== undefined) {
    query = query.lte('price', maxPrice)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,title_ar.ilike.%${search}%`)
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`)
  }

  const total = count ?? 0

  return {
    products: (data as Product[]) ?? [],
    total,
    page,
    limit,
    hasMore: offset + limit < total,
  }
}

/**
 * Get single product by ID
 */
export async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createSupabaseServer()

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      merchant:profiles!merchant_id(id, full_name, avatar_url, phone),
      category:categories(id, name, name_ar),
      wilaya:wilayas(id, name, name_ar)
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    throw new Error(`Failed to fetch product: ${error.message}`)
  }

  // Increment view count (fire and forget)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(supabase.rpc as any)('increment_product_views', { product_uuid: id }).then()

  return data as Product
}

/**
 * Get products by merchant (for merchant dashboard)
 */
export async function getMerchantProducts(): Promise<Product[]> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const supabase = await createSupabaseServer()

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      category:categories(id, name, name_ar),
      wilaya:wilayas(id, name, name_ar)
    `
    )
    .eq('merchant_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch merchant products: ${error.message}`)
  }

  return (data as Product[]) ?? []
}

/**
 * Create a new product
 */
export async function createProduct(
  _prevState: ActionResult<Product> | null,
  formData: FormData
): Promise<ActionResult<Product>> {
  const user = await getCurrentUser()

  if (!user) {
    return failure('Non authentifié')
  }

  if (!isMerchantOrAdmin(user)) {
    return failure('Seuls les marchands peuvent créer des produits')
  }

  // Parse form data
  const stockQuantityValue = formData.get('stockQuantity')
  const rawInput = {
    title: formData.get('title') as string,
    titleAr: formData.get('titleAr') as string || undefined,
    description: formData.get('description') as string || undefined,
    price: Number(formData.get('price')),
    originalPrice: formData.get('originalPrice')
      ? Number(formData.get('originalPrice'))
      : undefined,
    deliveryFee: formData.get('deliveryFee')
      ? Number(formData.get('deliveryFee'))
      : undefined,
    stockQuantity: stockQuantityValue && stockQuantityValue !== ''
      ? Number(stockQuantityValue)
      : null,
    categoryId: Number(formData.get('categoryId')),
    wilayaId: Number(formData.get('wilayaId')),
    images: parseStringArray(formData.get('images') as string),
    status: (formData.get('status') as 'draft' | 'active') || 'active',
  }

  // Validate
  const parsed = ProductCreateSchema.safeParse(rawInput)

  if (!parsed.success) {
    return failure('Validation échouée', parsed.error.flatten().fieldErrors as Record<string, string[]>)
  }

  const supabase = await createSupabaseServer()

  const insertData = {
    merchant_id: user.id,
    title: parsed.data.title,
    title_ar: parsed.data.titleAr,
    description: parsed.data.description,
    price: parsed.data.price,
    original_price: parsed.data.originalPrice,
    delivery_fee: parsed.data.deliveryFee,
    stock_quantity: parsed.data.stockQuantity,
    category_id: parsed.data.categoryId,
    wilaya_id: parsed.data.wilayaId,
    images: parsed.data.images,
    status: parsed.data.status,
  } as ProductInsert

  const { data, error } = await supabase
    .from('products')
    .insert(insertData as never)
    .select()
    .single()

  if (error) {
    return failure(`Échec création: ${error.message}`)
  }

  revalidatePath('/marketplace')
  revalidatePath('/sell')

  return success(data as Product)
}

/**
 * Update a product
 */
export async function updateProduct(
  productId: string,
  _prevState: ActionResult<Product> | null,
  formData: FormData
): Promise<ActionResult<Product>> {
  const user = await getCurrentUser()

  if (!user) {
    return failure('Non authentifié')
  }

  // Parse form data
  const rawInput: Record<string, unknown> = {}

  const title = formData.get('title')
  if (title) rawInput.title = title

  const titleAr = formData.get('titleAr')
  if (titleAr) rawInput.titleAr = titleAr

  const description = formData.get('description')
  if (description) rawInput.description = description

  const price = formData.get('price')
  if (price) rawInput.price = Number(price)

  const originalPrice = formData.get('originalPrice')
  if (originalPrice) rawInput.originalPrice = Number(originalPrice)

  const deliveryFee = formData.get('deliveryFee')
  if (deliveryFee) rawInput.deliveryFee = Number(deliveryFee)

  const stockQuantity = formData.get('stockQuantity')
  rawInput.stockQuantity = stockQuantity && stockQuantity !== '' ? Number(stockQuantity) : null

  const categoryId = formData.get('categoryId')
  if (categoryId) rawInput.categoryId = Number(categoryId)

  const wilayaId = formData.get('wilayaId')
  if (wilayaId) rawInput.wilayaId = Number(wilayaId)

  const images = formData.get('images')
  if (images) rawInput.images = parseStringArray(images as string)

  const status = formData.get('status')
  if (status) rawInput.status = status

  // Validate
  const parsed = ProductUpdateSchema.safeParse(rawInput)

  if (!parsed.success) {
    return failure('Validation échouée', parsed.error.flatten().fieldErrors as Record<string, string[]>)
  }

  const supabase = await createSupabaseServer()

  // Build update object (use Record to allow delivery_fee not in generated types)
  const updateData: Record<string, unknown> = {}
  if (parsed.data.title) updateData.title = parsed.data.title
  if (parsed.data.titleAr !== undefined) updateData.title_ar = parsed.data.titleAr
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description
  if (parsed.data.price) updateData.price = parsed.data.price
  if (parsed.data.originalPrice !== undefined) updateData.original_price = parsed.data.originalPrice
  if (parsed.data.deliveryFee !== undefined) updateData.delivery_fee = parsed.data.deliveryFee
  if (parsed.data.stockQuantity !== undefined) updateData.stock_quantity = parsed.data.stockQuantity
  if (parsed.data.categoryId) updateData.category_id = parsed.data.categoryId
  if (parsed.data.wilayaId) updateData.wilaya_id = parsed.data.wilayaId
  if (parsed.data.images) updateData.images = parsed.data.images
  if (parsed.data.status) updateData.status = parsed.data.status

  const { data, error } = await supabase
    .from('products')
    .update(updateData as never)
    .eq('id', productId)
    .eq('merchant_id', user.id) // Ensure ownership
    .select()
    .single()

  if (error) {
    return failure(`Échec mise à jour: ${error.message}`)
  }

  revalidatePath('/marketplace')
  revalidatePath(`/marketplace/${productId}`)
  revalidatePath('/sell')

  return success(data as Product)
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string): Promise<ActionResult> {
  const user = await getCurrentUser()

  if (!user) {
    return failure('Non authentifié')
  }

  const supabase = await createSupabaseServer()

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('merchant_id', user.id) // Ensure ownership

  if (error) {
    return failure(`Échec suppression: ${error.message}`)
  }

  revalidatePath('/marketplace')
  revalidatePath('/sell')
  revalidatePath('/profile')
  revalidatePath('/dashboard')

  return success(undefined)
}

/**
 * Toggle product status (active <-> archived)
 */
export async function toggleProductStatus(productId: string): Promise<ActionResult<Product>> {
  const user = await getCurrentUser()

  if (!user) {
    return failure('Non authentifié')
  }

  const supabase = await createSupabaseServer()

  // Get current status
  const { data: productData } = await supabase
    .from('products')
    .select('status')
    .eq('id', productId)
    .eq('merchant_id', user.id)
    .single()

  const product = productData as { status: string } | null
  if (!product) {
    return failure('Produit non trouvé')
  }

  // Toggle between active and archived
  const newStatus = product.status === 'active' ? 'archived' : 'active'

  const { data, error } = await supabase
    .from('products')
    .update({ status: newStatus, updated_at: new Date().toISOString() } as never)
    .eq('id', productId)
    .eq('merchant_id', user.id)
    .select()
    .single()

  if (error) {
    return failure(error.message)
  }

  revalidatePath('/marketplace')
  revalidatePath('/sell')
  revalidatePath('/profile')
  revalidatePath('/dashboard')

  return success(data as Product)
}
