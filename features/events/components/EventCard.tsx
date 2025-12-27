/**
 * Event Card Component
 * Display single event in grid
 */

import Link from 'next/link'
import type { EventWithDetails } from '../types/event.types'

type Props = {
  event: EventWithDetails
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-DZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('fr-DZ', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function EventCard({ event }: Props) {
  const isPast = new Date(event.start_date) < new Date()

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow ${isPast ? 'opacity-60' : ''}`}>
      {/* Cover image or gradient */}
      <div className="relative h-32 bg-gradient-to-br from-blue-500 to-indigo-600">
        {event.cover_image ? (
          <img
            src={event.cover_image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Date badge */}
        <div className="absolute top-3 left-3 bg-white rounded-lg px-2 py-1 text-center shadow">
          <div className="text-xs font-bold text-blue-600 uppercase">
            {new Date(event.start_date).toLocaleDateString('fr-DZ', { month: 'short' })}
          </div>
          <div className="text-lg font-bold text-gray-900">
            {new Date(event.start_date).getDate()}
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-3 right-3 flex gap-1">
          {event.is_free && (
            <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full">
              Gratuit
            </span>
          )}
          {event.is_online && (
            <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-medium rounded-full">
              En ligne
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {event.category && (
          <span className="text-xs text-blue-600 font-medium">
            {event.category.name}
          </span>
        )}

        {/* Title */}
        <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2">
          {event.title}
        </h3>

        {/* Time & Location */}
        <div className="mt-2 space-y-1 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatDate(event.start_date)} a {formatTime(event.start_date)}</span>
          </div>

          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">
              {event.is_online ? 'Evenement en ligne' : event.location_name}
            </span>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="mt-4 flex items-center justify-between">
          {!event.is_free && event.price && (
            <span className="font-bold text-gray-900">
              {event.price} DA
            </span>
          )}

          {event.registration_url ? (
            <Link
              href={event.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              S'inscrire
            </Link>
          ) : (
            <span className="ml-auto text-xs text-gray-400">
              Pas d'inscription
            </span>
          )}
        </div>

        {/* Capacity indicator */}
        {event.max_attendees && (
          <div className="mt-3 text-xs text-gray-500">
            <div className="flex justify-between mb-1">
              <span>{event.current_attendees} / {event.max_attendees} inscrits</span>
              <span>{Math.round((event.current_attendees / event.max_attendees) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min((event.current_attendees / event.max_attendees) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
