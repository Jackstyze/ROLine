/**
 * Events Grid Component
 * Display events in responsive grid
 */

import { EventCard } from './EventCard'
import type { EventWithDetails } from '../types/event.types'

type Props = {
  events: EventWithDetails[]
}

export function EventsGrid({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Aucun evenement a venir
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Revenez bientot pour decouvrir les prochains evenements
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}
