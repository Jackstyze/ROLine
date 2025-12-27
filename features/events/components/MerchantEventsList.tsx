/**
 * Merchant Events List
 * Display and manage events in merchant dashboard
 */

import Link from 'next/link'
import { getMerchantEvents } from '../actions/events.actions'
import { EventActions } from './EventActions'
import { PromoteEventButton } from './PromoteEventButton'

export async function MerchantEventsList() {
  const events = await getMerchantEvents()

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-4 block">📅</span>
        <p className="text-gray-500 mb-4">Vous n'avez pas encore d'événements</p>
        <Link
          href="/dashboard/events/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Créer un événement
        </Link>
      </div>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Mes événements ({events.length})</h2>
        <Link
          href="/dashboard/events/new"
          className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau
        </Link>
      </div>

      <div className="divide-y border rounded-lg bg-white">
        {events.map((event) => (
          <div key={event.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    event.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {event.is_active ? 'Actif' : 'Inactif'}
                  </span>
                  {event.is_featured && (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded">
                      Promu
                    </span>
                  )}
                  {event.is_online && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                      En ligne
                    </span>
                  )}
                  {event.is_free && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                      Gratuit
                    </span>
                  )}
                </div>

                <h3 className="font-medium text-gray-900 mt-1">{event.title}</h3>

                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(event.start_date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {event.location_name}
                  </span>
                </div>

                {event.max_attendees && (
                  <div className="mt-1 text-xs text-gray-400">
                    {event.current_attendees}/{event.max_attendees} inscrits
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {event.is_active && (
                  <PromoteEventButton
                    eventId={event.id}
                    eventTitle={event.title}
                    isPromoted={event.is_featured}
                    promotedUntil={event.promoted_until}
                  />
                )}
                <Link
                  href={`/dashboard/events/${event.id}/edit`}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                  title="Modifier"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>
                <EventActions
                  eventId={event.id}
                  eventTitle={event.title}
                  isActive={event.is_active}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
