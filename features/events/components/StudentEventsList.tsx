/**
 * Student Events List
 * Display registered events for students in dashboard
 */

import Link from 'next/link'
import { getUserRegisteredEvents } from '../actions/events.actions'
import { Calendar, MapPin, ExternalLink } from 'lucide-react'

export async function StudentEventsList() {
  const events = await getUserRegisteredEvents()

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-4 block">📅</span>
        <p className="text-muted-foreground mb-4">Vous n'êtes inscrit à aucun événement</p>
        <Link
          href="/marketplace?tab=events"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          Découvrir les événements
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

  const isUpcoming = (date: string) => new Date(date) > new Date()

  return (
    <div className="space-y-3">
      {events.slice(0, 5).map((event) => {
        const upcoming = isUpcoming(event.start_date)
        return (
          <div
            key={event.id}
            className={`p-4 bg-white rounded-xl border ${upcoming ? 'border-emerald-100' : 'border-gray-100 opacity-60'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {upcoming ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                      À venir
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                      Passé
                    </span>
                  )}
                  {event.is_online && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      En ligne
                    </span>
                  )}
                  {event.is_free && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      Gratuit
                    </span>
                  )}
                </div>

                <h3 className="font-medium text-foreground">{event.title}</h3>

                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(event.start_date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {event.location_name}
                  </span>
                </div>
              </div>

              <Link
                href={`/marketplace/events/${event.id}`}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Voir détails"
              >
                <ExternalLink className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )
      })}

      {events.length > 5 && (
        <Link
          href="/profile/events"
          className="block text-center text-sm text-emerald-600 hover:text-emerald-700 py-2"
        >
          Voir tous mes événements ({events.length})
        </Link>
      )}
    </div>
  )
}
