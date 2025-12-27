'use client'

/**
 * Profile Edit Form Component
 */

import { useActionState } from 'react'
import { updateProfile } from '../actions/auth.actions'
import type { CurrentUser } from '../actions/auth.actions'
import type { ActionResult } from '@/shared/types/actions.types'
import wilayas from '@/data/wilayas.json'

type Props = {
  user: CurrentUser
}

export function ProfileForm({ user }: Props) {
  const [state, formAction, isPending] = useActionState<ActionResult<void> | null, FormData>(
    async (_prev, formData) => updateProfile(formData),
    null
  )

  const profile = user.profile
  const fieldErrors = state?.success === false ? state.fieldErrors : undefined

  return (
    <form action={formAction} className="space-y-6">
      {/* Success message */}
      {state?.success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          Profil mis à jour avec succès
        </div>
      )}

      {/* Error message */}
      {state?.success === false && !fieldErrors && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Email (read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          value={user.email || ''}
          disabled
          className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          L&apos;email ne peut pas être modifié
        </p>
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
          Nom complet
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          defaultValue={profile?.full_name || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {fieldErrors?.fullName && (
          <p className="mt-1 text-sm text-red-600">
            {fieldErrors.fullName[0]}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Téléphone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile?.phone || ''}
          placeholder="0555123456"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Format: 0555123456 ou +213555123456
        </p>
        {fieldErrors?.phone && (
          <p className="mt-1 text-sm text-red-600">
            {fieldErrors.phone[0]}
          </p>
        )}
      </div>

      {/* Wilaya */}
      <div>
        <label htmlFor="wilayaId" className="block text-sm font-medium text-gray-700">
          Wilaya
        </label>
        <select
          id="wilayaId"
          name="wilayaId"
          defaultValue={profile?.wilaya_id || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Sélectionner une wilaya</option>
          {wilayas.map((wilaya) => (
            <option key={wilaya.id} value={wilaya.id}>
              {wilaya.id}. {wilaya.name} - {wilaya.name_ar}
            </option>
          ))}
        </select>
        {fieldErrors?.wilayaId && (
          <p className="mt-1 text-sm text-red-600">
            {fieldErrors.wilayaId[0]}
          </p>
        )}
      </div>

      {/* Role (read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Type de compte
        </label>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-2xl">
            {profile?.role === 'merchant' ? '🏪' : '🎓'}
          </span>
          <span className="text-gray-700">
            {profile?.role === 'merchant' ? 'Marchand' :
             profile?.role === 'admin' ? 'Administrateur' : 'Étudiant'}
          </span>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
