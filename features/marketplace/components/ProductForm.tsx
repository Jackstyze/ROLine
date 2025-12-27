'use client'

/**
 * Product Form Component
 * Create or edit products
 */

import { useActionState, useState, useCallback } from 'react'
import { createProduct, updateProduct } from '../actions/products.actions'
import type { Product } from '../actions/products.actions'
import type { ActionResult } from '@/shared/types/actions.types'
import wilayas from '@/data/wilayas.json'
import categories from '@/data/categories.json'
import Link from 'next/link'

type ProductFormProps = {
  product?: Product | null // For editing
}

export function ProductForm({ product }: ProductFormProps) {
  const isEditing = !!product

  // Bind productId to updateProduct for edit mode
  const boundUpdateProduct = useCallback(
    (prevState: ActionResult<Product> | null, formData: FormData) => updateProduct(product?.id || '', prevState, formData),
    [product?.id]
  )

  const [state, formAction, isPending] = useActionState(
    isEditing ? boundUpdateProduct : createProduct,
    null
  )
  const [images, setImages] = useState<string[]>(product?.images || [])
  const [imageUrl, setImageUrl] = useState('')

  // Success state
  if (state?.success) {
    const productId = state.data?.id || product?.id
    return (
      <div className="rounded-md bg-green-50 p-6 text-center">
        <h3 className="text-lg font-medium text-green-800">
          {isEditing ? 'Produit modifié avec succès !' : 'Produit créé avec succès !'}
        </h3>
        <p className="mt-2 text-sm text-green-700">
          {isEditing ? 'Vos modifications ont été enregistrées.' : 'Votre produit est maintenant visible sur le marketplace.'}
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <Link
            href={`/marketplace/${productId}`}
            className="text-sm text-green-600 hover:text-green-500"
          >
            Voir le produit
          </Link>
          {!isEditing && (
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-green-600 hover:text-green-500"
            >
              Créer un autre produit
            </button>
          )}
          <Link
            href="/dashboard"
            className="text-sm text-green-600 hover:text-green-500"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    )
  }

  const addImage = () => {
    if (imageUrl && images.length < 5) {
      setImages([...images, imageUrl])
      setImageUrl('')
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Global error */}
      {state?.success === false && !state.fieldErrors && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert">
          {state.error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Titre du produit *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={product?.title}
          placeholder="Ex: MacBook Pro 2023"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
        {state?.fieldErrors?.title && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.title[0]}</p>
        )}
      </div>

      {/* Arabic Title */}
      <div>
        <label htmlFor="titleAr" className="block text-sm font-medium text-gray-700">
          Titre en arabe (optionnel)
        </label>
        <input
          id="titleAr"
          name="titleAr"
          type="text"
          dir="rtl"
          defaultValue={product?.title_ar || ''}
          placeholder="العنوان بالعربية"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product?.description || ''}
          placeholder="Décrivez votre produit..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Price */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Prix (DA) *
          </label>
          <input
            id="price"
            name="price"
            type="number"
            required
            min="1"
            defaultValue={product?.price}
            placeholder="15000"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          {state?.fieldErrors?.price && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.price[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700">
            Prix original (optionnel)
          </label>
          <input
            id="originalPrice"
            name="originalPrice"
            type="number"
            min="1"
            defaultValue={product?.original_price || ''}
            placeholder="20000"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">Pour afficher une réduction</p>
        </div>
      </div>

      {/* Delivery Fee & Stock */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="deliveryFee" className="block text-sm font-medium text-gray-700">
            Frais de livraison (DA)
          </label>
          <input
            id="deliveryFee"
            name="deliveryFee"
            type="number"
            min="0"
            defaultValue={product?.delivery_fee || ''}
            placeholder="500"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">0 = livraison gratuite</p>
          {state?.fieldErrors?.deliveryFee && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.deliveryFee[0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700">
            Stock disponible
          </label>
          <input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            min="0"
            defaultValue={product?.stock_quantity ?? ''}
            placeholder="Illimité"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">Vide = illimité</p>
        </div>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
          Catégorie *
        </label>
        <select
          id="categoryId"
          name="categoryId"
          required
          defaultValue={product?.category_id || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Sélectionner une catégorie</option>
          {categories.map((cat) => (
            <optgroup key={cat.id} label={`${cat.name} - ${cat.name_ar}`}>
              {cat.children?.map((subcat) => (
                <option key={subcat.id} value={subcat.id}>
                  {subcat.name} - {subcat.name_ar}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {state?.fieldErrors?.categoryId && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.categoryId[0]}</p>
        )}
      </div>

      {/* Wilaya */}
      <div>
        <label htmlFor="wilayaId" className="block text-sm font-medium text-gray-700">
          Wilaya *
        </label>
        <select
          id="wilayaId"
          name="wilayaId"
          required
          defaultValue={product?.wilaya_id || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Sélectionner une wilaya</option>
          {wilayas.map((w) => (
            <option key={w.id} value={w.id}>
              {w.id}. {w.name} - {w.name_ar}
            </option>
          ))}
        </select>
        {state?.fieldErrors?.wilayaId && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.wilayaId[0]}</p>
        )}
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Images (max 5) *
        </label>

        {/* Image list */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden group"
              >
                <img src={img} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add image input */}
        {images.length < 5 && (
          <div className="flex gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={addImage}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Ajouter
            </button>
          </div>
        )}

        {/* Hidden input for form submission */}
        <input type="hidden" name="images" value={JSON.stringify(images)} />

        {state?.fieldErrors?.images && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.images[0]}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Collez les URLs de vos images (hébergées sur un CDN)
        </p>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="status"
              value="active"
              defaultChecked={!product || product.status === 'active'}
              className="text-blue-600"
            />
            <span>Publier maintenant</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="status"
              value="draft"
              defaultChecked={product?.status === 'draft'}
              className="text-blue-600"
            />
            <span>Brouillon</span>
          </label>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isPending || images.length === 0}
          className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Publication...' : product ? 'Mettre à jour' : 'Publier le produit'}
        </button>
        <Link
          href="/dashboard"
          className="py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
        >
          Annuler
        </Link>
      </div>
    </form>
  )
}
