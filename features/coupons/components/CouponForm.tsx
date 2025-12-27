'use client'

/**
 * Coupon Form Component
 * Create or edit coupons
 */

import { useActionState, useState } from 'react'
import { createCoupon } from '../actions/coupons.actions'
import type { CouponWithRules } from '../types/coupon.types'
import Link from 'next/link'
import categories from '@/data/categories.json'

type Category = {
  id: number
  name: string
  name_ar: string
  children?: { id: number; name: string; name_ar: string }[]
}

type Props = {
  coupon?: CouponWithRules | null
}

export function CouponForm({ coupon }: Props) {
  const isEditing = !!coupon
  const [state, formAction, isPending] = useActionState(createCoupon, null)
  type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping' | 'access_unlock'
  const [discountType, setDiscountType] = useState<DiscountType>(coupon?.discount_type || 'percentage')

  // Get existing category IDs from coupon rules
  const existingCategoryIds = coupon?.coupon_rules
    ?.filter(r => r.rule_type === 'category')
    .flatMap(r => r.target_ids?.map(Number) || []) || []
  const [selectedCategories, setSelectedCategories] = useState<number[]>(existingCategoryIds)

  const toggleCategory = (catId: number) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    )
  }

  // Success state
  if (state?.success) {
    return (
      <div className="rounded-md bg-green-50 p-6 text-center">
        <h3 className="text-lg font-medium text-green-800">
          Coupon {isEditing ? 'modifié' : 'créé'} avec succès !
        </h3>
        <div className="mt-4 flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-green-600 hover:text-green-500"
          >
            Retour au tableau de bord
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-green-600 hover:text-green-500"
          >
            Créer un autre
          </button>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Global error */}
      {state?.success === false && !state.fieldErrors && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert">
          {state.error}
        </div>
      )}

      {/* Code */}
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700">
          Code promo (optionnel)
        </label>
        <input
          id="code"
          name="code"
          type="text"
          defaultValue={coupon?.code || ''}
          placeholder="PROMO20"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 uppercase focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          Laissez vide pour un coupon appliqué automatiquement
        </p>
        {state?.fieldErrors?.code && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.code[0]}</p>
        )}
      </div>

      {/* Title */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Titre *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={coupon?.title}
            placeholder="Réduction étudiants"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          {state?.fieldErrors?.title && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.title[0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="titleAr" className="block text-sm font-medium text-gray-700">
            Titre arabe
          </label>
          <input
            id="titleAr"
            name="titleAr"
            type="text"
            dir="rtl"
            defaultValue={coupon?.title_ar || ''}
            placeholder="تخفيض للطلاب"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={coupon?.description || ''}
          placeholder="Description du coupon..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Discount Type & Value */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="discountType" className="block text-sm font-medium text-gray-700">
            Type de réduction *
          </label>
          <select
            id="discountType"
            name="discountType"
            required
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as DiscountType)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="percentage">Pourcentage (%)</option>
            <option value="fixed_amount">Montant fixe (DA)</option>
            <option value="free_shipping">Livraison gratuite</option>
          </select>
        </div>
        {discountType !== 'free_shipping' && (
          <div>
            <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700">
              Valeur *
            </label>
            <input
              id="discountValue"
              name="discountValue"
              type="number"
              required
              min="0"
              max={discountType === 'percentage' ? 100 : 100000}
              defaultValue={coupon?.discount_value || ''}
              placeholder={discountType === 'percentage' ? '20' : '500'}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
            {state?.fieldErrors?.discountValue && (
              <p className="mt-1 text-sm text-red-600">{state.fieldErrors.discountValue[0]}</p>
            )}
          </div>
        )}
      </div>

      {/* Applies To & Target Audience */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="appliesTo" className="block text-sm font-medium text-gray-700">
            S'applique à
          </label>
          <select
            id="appliesTo"
            name="appliesTo"
            defaultValue={coupon?.applies_to || 'products'}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="products">Produits</option>
            <option value="all">Tout</option>
          </select>
        </div>
        <div>
          <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700">
            Audience cible
          </label>
          <select
            id="targetAudience"
            name="targetAudience"
            defaultValue={coupon?.target_audience || 'all'}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Tous</option>
            <option value="students">Étudiants seulement</option>
            <option value="merchants">Marchands seulement</option>
          </select>
        </div>
      </div>

      {/* Categories Restriction */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Limiter aux catégories (optionnel)
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Si vide, le coupon s'applique à toutes les catégories
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
          {(categories as Category[]).map(cat => (
            <div key={cat.id}>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={cat.id}
                  checked={selectedCategories.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">{cat.name}</span>
              </label>
              {cat.children?.map(sub => (
                <label key={sub.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 pl-6 rounded">
                  <input
                    type="checkbox"
                    name="categoryIds"
                    value={sub.id}
                    checked={selectedCategories.includes(sub.id)}
                    onChange={() => toggleCategory(sub.id)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-xs text-gray-600">{sub.name}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Date de début
          </label>
          <input
            id="startDate"
            name="startDate"
            type="datetime-local"
            defaultValue={coupon?.start_date?.slice(0, 16) || ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            Date de fin
          </label>
          <input
            id="endDate"
            name="endDate"
            type="datetime-local"
            defaultValue={coupon?.end_date?.slice(0, 16) || ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          {state?.fieldErrors?.endDate && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.endDate[0]}</p>
          )}
        </div>
      </div>

      {/* Limits */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="maxTotalUses" className="block text-sm font-medium text-gray-700">
            Utilisations max
          </label>
          <input
            id="maxTotalUses"
            name="maxTotalUses"
            type="number"
            min="1"
            defaultValue={coupon?.max_total_uses || ''}
            placeholder="Illimité"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="maxUsesPerUser" className="block text-sm font-medium text-gray-700">
            Par utilisateur
          </label>
          <input
            id="maxUsesPerUser"
            name="maxUsesPerUser"
            type="number"
            min="1"
            defaultValue={coupon?.max_uses_per_user || 1}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="minPurchaseAmount" className="block text-sm font-medium text-gray-700">
            Montant min (DA)
          </label>
          <input
            id="minPurchaseAmount"
            name="minPurchaseAmount"
            type="number"
            min="0"
            defaultValue={coupon?.min_purchase_amount || ''}
            placeholder="0"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isActive"
            value="true"
            defaultChecked={coupon?.is_active !== false}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Actif</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isPublic"
            value="true"
            defaultChecked={coupon?.is_public !== false}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Public</span>
        </label>
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer le coupon'}
        </button>
        <Link
          href="/dashboard"
          className="py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 text-center"
        >
          Annuler
        </Link>
      </div>
    </form>
  )
}
