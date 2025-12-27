/**
 * Edit Event Page
 */

import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, hasRole } from '@/features/auth/actions/auth.actions'
import { getEventForEdit } from '@/features/events/actions/events.actions'
import { EventForm } from '@/features/events/components/EventForm'
import Link from 'next/link'

export const metadata = {
  title: 'Modifier l\'événement | RO Line',
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditEventPage({ params }: Props) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/dashboard/events')
  }

  const isMerchant = await hasRole('merchant')

  if (!isMerchant) {
    redirect('/dashboard')
  }

  const event = await getEventForEdit(id)

  if (!event) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Modifier l'événement</h1>
        <p className="text-gray-600">{event.title}</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <EventForm event={event} />
      </div>
    </div>
  )
}
