'use client'

/**
 * Event Form Component
 * Supports both create and edit modes
 */

import { useActionState, useState } from 'react'
import { createEvent, updateEvent } from '../actions/events.actions'
import Link from 'next/link'
import categories from '@/data/categories.json'
import wilayas from '@/data/wilayas.json'
import type { EventWithDetails } from '../types/event.types'

type Category = { id: number; name: string; name_ar: string; children?: Category[] }
type Wilaya = { id: number; name: string; name_ar: string }

type Props = {
  event?: EventWithDetails
}

export function EventForm({ event }: Props) {
  const isEdit = !!event
  const action = isEdit ? updateEvent : createEvent
  const [state, formAction, isPending] = useActionState(action, null)
  const [isOnline, setIsOnline] = useState(event?.is_online ?? false)
  const [isFree, setIsFree] = useState(event?.is_free ?? true)

  // Helper to format date for input
  const formatDateForInput = (dateStr: string | null) => {
    if (!dateStr) return ''
    return new Date(dateStr).toISOString().slice(0, 16)
  }

  if (state?.success) {
    return (
      <div className="rounded-md bg-green-50 p-6 text-center">
        <h3 className="text-lg font-medium text-green-800">
          {isEdit ? 'Événement mis à jour !' : 'Événement créé avec succès !'}
        </h3>
        {isEdit && (
          <p className="text-sm text-green-600 mt-2">
            Les participants inscrits seront notifiés des changements importants.
          </p>
        )}
        <div className="mt-4 flex justify-center gap-4">
          <Link href="/dashboard" className="text-sm text-green-600 hover:text-green-500">
            Retour au tableau de bord
          </Link>
          {!isEdit && (
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-green-600 hover:text-green-500"
            >
              Créer un autre
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-6">
      {isEdit && <input type="hidden" name="eventId" value={event.id} />}

      {state?.success === false && !state.fieldErrors && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert">
          {state.error}
        </div>
      )}

      {isEdit && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <strong>Note:</strong> Les participants seront notifiés si vous modifiez la date ou le lieu.
        </div>
      )}

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
            defaultValue={event?.title}
            placeholder="Conférence Tech"
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
            defaultValue={event?.title_ar ?? ''}
            placeholder="مؤتمر التقنية"
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
          rows={3}
          defaultValue={event?.description ?? ''}
          placeholder="Description de l'événement..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
          Catégorie
        </label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={event?.category_id ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Sélectionner...</option>
          {(categories as Category[]).map(cat => (
            <optgroup key={cat.id} label={cat.name}>
              {cat.children?.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Date de début *
          </label>
          <input
            id="startDate"
            name="startDate"
            type="datetime-local"
            required
            defaultValue={formatDateForInput(event?.start_date ?? null)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          {state?.fieldErrors?.startDate && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.startDate[0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            Date de fin
          </label>
          <input
            id="endDate"
            name="endDate"
            type="datetime-local"
            defaultValue={formatDateForInput(event?.end_date ?? null)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Event Type */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isOnline"
            value="true"
            checked={isOnline}
            onChange={e => setIsOnline(e.target.checked)}
            className="rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-700">Événement en ligne</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isFree"
            value="true"
            checked={isFree}
            onChange={e => setIsFree(e.target.checked)}
            className="rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-700">Gratuit</span>
        </label>
      </div>

      {/* Online URL */}
      {isOnline && (
        <div>
          <label htmlFor="onlineUrl" className="block text-sm font-medium text-gray-700">
            Lien de l'événement
          </label>
          <input
            id="onlineUrl"
            name="onlineUrl"
            type="url"
            defaultValue={event?.online_url ?? ''}
            placeholder="https://meet.google.com/..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
      )}

      {/* Location (if not online) */}
      {!isOnline && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="locationName" className="block text-sm font-medium text-gray-700">
                Lieu *
              </label>
              <input
                id="locationName"
                name="locationName"
                type="text"
                defaultValue={event?.location_name ?? ''}
                placeholder="Salle de conférence"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
              {state?.fieldErrors?.locationName && (
                <p className="mt-1 text-sm text-red-600">{state.fieldErrors.locationName[0]}</p>
              )}
            </div>
            <div>
              <label htmlFor="wilayaId" className="block text-sm font-medium text-gray-700">
                Wilaya
              </label>
              <select
                id="wilayaId"
                name="wilayaId"
                defaultValue={event?.wilaya_id ?? ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Sélectionner...</option>
                {(wilayas as Wilaya[]).map(w => (
                  <option key={w.id} value={w.id}>{w.id} - {w.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="locationAddress" className="block text-sm font-medium text-gray-700">
              Adresse
            </label>
            <input
              id="locationAddress"
              name="locationAddress"
              type="text"
              defaultValue={event?.location_address ?? ''}
              placeholder="123 Rue Example, Alger"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </>
      )}

      {/* Price (if not free) */}
      {!isFree && (
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Prix (DA)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            defaultValue={event?.price ?? ''}
            placeholder="1000"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
      )}

      {/* Registration & Capacity */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="registrationUrl" className="block text-sm font-medium text-gray-700">
            Lien d'inscription
          </label>
          <input
            id="registrationUrl"
            name="registrationUrl"
            type="url"
            defaultValue={event?.registration_url ?? ''}
            placeholder="https://forms.google.com/..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="maxAttendees" className="block text-sm font-medium text-gray-700">
            Capacité max
          </label>
          <input
            id="maxAttendees"
            name="maxAttendees"
            type="number"
            min="1"
            defaultValue={event?.max_attendees ?? ''}
            placeholder="100"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (isEdit ? 'Mise à jour...' : 'Création...') : (isEdit ? 'Mettre à jour' : 'Créer l\'événement')}
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
