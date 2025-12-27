/**
 * Mes Événements Page
 * Display user's registered events
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/features/auth/actions/auth.actions'
import { getUserRegisteredEvents } from '@/features/events/actions/events.actions'
import { Calendar, MapPin, ExternalLink } from 'lucide-react'

export const metadata = {
  title: 'Mes Événements | RO Line',
  description: 'Vos événements inscrits',
}

async function RegisteredEventsContent() {
  const events = await getUserRegisteredEvents()

  if (events.length === 0) {
    return (
      <div className="text-center py-12 glass rounded-2xl">
        <span className="text-5xl mb-4 block">📅</span>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Aucun événement
        </h3>
        <p className="text-muted-foreground mb-6">
          Vous n'êtes inscrit à aucun événement
        </p>
        <Link
          href="/marketplace?tab=events"
          className="inline-block py-3 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          Découvrir les événements
        </Link>
      </div>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isUpcoming = (date: string) => new Date(date) > new Date()

  const upcomingEvents = events.filter(e => isUpcoming(e.start_date))
  const pastEvents = events.filter(e => !isUpcoming(e.start_date))

  return (
    <div className="space-y-8">
      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-emerald-700 mb-3">
            À venir ({upcomingEvents.length})
          </h2>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 glass rounded-2xl border border-emerald-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                        À venir
                      </span>
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

                    <h3 className="font-semibold text-foreground">{event.title}</h3>

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

                    {event.online_url && (
                      <a
                        href={event.online_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-sm text-emerald-600 hover:text-emerald-700"
                      >
                        Rejoindre <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <Link
                    href={`/marketplace/events/${event.id}`}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                    title="Voir détails"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Passés ({pastEvents.length})
          </h2>
          <div className="space-y-3">
            {pastEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 glass rounded-2xl opacity-60"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                        Passé
                      </span>
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="glass rounded-2xl p-4 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-1/4" />
              <div className="h-5 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function MesEvenementsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-green-700 hover:text-green-800 font-medium"
        >
          ← Retour au dashboard
        </Link>
        <div className="glass rounded-2xl p-6 mt-4 relative overflow-hidden">
          <div className="absolute inset-0 algerian-pattern opacity-[0.03]" />
          <div className="relative flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mes Événements</h1>
              <p className="text-muted-foreground">Événements auxquels vous êtes inscrit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick link to discover events */}
      <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <div className="flex items-center justify-between">
          <p className="text-sm text-emerald-800">
            Découvrez plus d'événements dans le marketplace
          </p>
          <Link
            href="/marketplace?tab=events"
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all"
          >
            Voir les événements
          </Link>
        </div>
      </div>

      {/* Registered Events */}
      <Suspense fallback={<LoadingSkeleton />}>
        <RegisteredEventsContent />
      </Suspense>
    </div>
  )
}
