'use server'

/**
 * Events Actions
 * Public events listing for marketplace
 */

import { createSupabaseServer } from '@/shared/lib/supabase/server'
import type { EventWithDetails, EventFilters } from '../types/event.types'
import { success, failure, type ActionResult } from '@/shared/types/actions.types'
import { EventCreateSchema } from '../schemas/event.schema'
import { revalidatePath } from 'next/cache'

/**
 * Get public events (active, upcoming)
 */
export async function getPublicEvents(filters?: EventFilters): Promise<EventWithDetails[]> {
  const supabase = await createSupabaseServer()

  let query = supabase
    .from('events')
    .select(`
      *,
      category:categories(id, name),
      wilaya:wilayas(id, name)
    `)
    .eq('is_active', true)
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })

  // Apply filters
  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }

  if (filters?.wilayaId) {
    query = query.eq('wilaya_id', filters.wilayaId)
  }

  if (filters?.isFree !== undefined) {
    query = query.eq('is_free', filters.isFree)
  }

  if (filters?.isOnline !== undefined) {
    query = query.eq('is_online', filters.isOnline)
  }

  const { data, error } = await query.limit(50)

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`)
  }

  return (data || []) as EventWithDetails[]
}

/**
 * Get single event by ID
 */
export async function getEvent(id: string): Promise<EventWithDetails | null> {
  const supabase = await createSupabaseServer()

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      category:categories(id, name),
      wilaya:wilayas(id, name)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw new Error(`Failed to fetch event: ${error.message}`)
  }

  return data as EventWithDetails | null
}

/**
 * Get featured events for homepage
 */
export async function getFeaturedEvents(limit = 4): Promise<EventWithDetails[]> {
  const supabase = await createSupabaseServer()

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      category:categories(id, name),
      wilaya:wilayas(id, name)
    `)
    .eq('is_active', true)
    .eq('is_featured', true)
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch featured events: ${error.message}`)
  }

  return (data || []) as EventWithDetails[]
}

/**
 * Get merchant's events
 */
export async function getMerchantEvents(): Promise<EventWithDetails[]> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      category:categories(id, name),
      wilaya:wilayas(id, name)
    `)
    .eq('organizer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch merchant events: ${error.message}`)
  }

  return (data || []) as EventWithDetails[]
}

/**
 * Create event
 */
export async function createEvent(_: unknown, formData: FormData): Promise<ActionResult<EventWithDetails>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return failure('Non authentifié')
  }

  // Parse form data
  const rawInput = {
    title: formData.get('title') as string,
    titleAr: formData.get('titleAr') as string || null,
    description: formData.get('description') as string || null,
    categoryId: formData.get('categoryId') ? parseInt(formData.get('categoryId') as string) : null,
    startDate: formData.get('startDate') as string,
    endDate: formData.get('endDate') as string || null,
    locationName: (formData.get('locationName') as string) || 'En ligne',
    locationAddress: formData.get('locationAddress') as string || null,
    wilayaId: formData.get('wilayaId') ? parseInt(formData.get('wilayaId') as string) : null,
    isOnline: formData.get('isOnline') === 'true',
    onlineUrl: formData.get('onlineUrl') as string || null,
    isFree: formData.get('isFree') !== 'false',
    price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
    registrationUrl: formData.get('registrationUrl') as string || null,
    maxAttendees: formData.get('maxAttendees') ? parseInt(formData.get('maxAttendees') as string) : null,
  }

  // Validate with Zod schema
  const parsed = EventCreateSchema.safeParse(rawInput)
  if (!parsed.success) {
    return failure('Validation échouée', parsed.error.flatten().fieldErrors as Record<string, string[]>)
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      organizer_id: user.id,
      title: parsed.data.title,
      title_ar: parsed.data.titleAr,
      description: parsed.data.description,
      category_id: parsed.data.categoryId,
      start_date: parsed.data.startDate.toISOString(),
      end_date: parsed.data.endDate?.toISOString() || null,
      location_name: parsed.data.locationName,
      location_address: parsed.data.locationAddress,
      wilaya_id: parsed.data.wilayaId,
      is_online: parsed.data.isOnline,
      online_url: parsed.data.onlineUrl,
      is_free: parsed.data.isFree,
      price: parsed.data.price,
      registration_url: parsed.data.registrationUrl,
      max_attendees: parsed.data.maxAttendees,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return failure(`Erreur création: ${error.message}`)
  }

  revalidatePath('/marketplace')
  revalidatePath('/dashboard/events')

  return success(data as EventWithDetails)
}

/**
 * Toggle event status
 */
export async function toggleEventStatus(eventId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return failure('Non authentifié')
  }

  const { data: event } = await supabase
    .from('events')
    .select('is_active')
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .single()

  if (!event) {
    return failure('Événement non trouvé')
  }

  const { error } = await supabase
    .from('events')
    .update({ is_active: !event.is_active })
    .eq('id', eventId)
    .eq('organizer_id', user.id)

  if (error) {
    return failure('Erreur lors de la mise à jour')
  }

  return success(undefined)
}

/**
 * Delete event
 */
export async function deleteEvent(eventId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return failure('Non authentifié')
  }

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('organizer_id', user.id)

  if (error) {
    return failure('Erreur lors de la suppression')
  }

  return success(undefined)
}

/**
 * Get event for editing (includes inactive)
 */
export async function getEventForEdit(id: string): Promise<EventWithDetails | null> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      category:categories(id, name),
      wilaya:wilayas(id, name)
    `)
    .eq('id', id)
    .eq('organizer_id', user.id)
    .single()

  if (error) return null

  return data as EventWithDetails | null
}

/**
 * Update event and notify registered users
 */
export async function updateEvent(_: unknown, formData: FormData): Promise<ActionResult<EventWithDetails>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return failure('Non authentifié')
  }

  const eventId = formData.get('eventId') as string

  // Verify ownership
  const { data: existing } = await supabase
    .from('events')
    .select('id, title, start_date, location_name')
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .single()

  if (!existing) {
    return failure('Événement non trouvé')
  }

  // Parse form data
  const rawInput = {
    title: formData.get('title') as string,
    titleAr: formData.get('titleAr') as string || null,
    description: formData.get('description') as string || null,
    categoryId: formData.get('categoryId') ? parseInt(formData.get('categoryId') as string) : null,
    startDate: formData.get('startDate') as string,
    endDate: formData.get('endDate') as string || null,
    locationName: (formData.get('locationName') as string) || 'En ligne',
    locationAddress: formData.get('locationAddress') as string || null,
    wilayaId: formData.get('wilayaId') ? parseInt(formData.get('wilayaId') as string) : null,
    isOnline: formData.get('isOnline') === 'true',
    onlineUrl: formData.get('onlineUrl') as string || null,
    isFree: formData.get('isFree') !== 'false',
    price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
    registrationUrl: formData.get('registrationUrl') as string || null,
    maxAttendees: formData.get('maxAttendees') ? parseInt(formData.get('maxAttendees') as string) : null,
  }

  // Validate
  const parsed = EventCreateSchema.safeParse(rawInput)
  if (!parsed.success) {
    return failure('Validation échouée', parsed.error.flatten().fieldErrors as Record<string, string[]>)
  }

  // Detect changes for notification
  const dateChanged = existing.start_date !== parsed.data.startDate.toISOString()
  const locationChanged = existing.location_name !== parsed.data.locationName

  // Update event
  const { data, error } = await supabase
    .from('events')
    .update({
      title: parsed.data.title,
      title_ar: parsed.data.titleAr,
      description: parsed.data.description,
      category_id: parsed.data.categoryId,
      start_date: parsed.data.startDate.toISOString(),
      end_date: parsed.data.endDate?.toISOString() || null,
      location_name: parsed.data.locationName,
      location_address: parsed.data.locationAddress,
      wilaya_id: parsed.data.wilayaId,
      is_online: parsed.data.isOnline,
      online_url: parsed.data.onlineUrl,
      is_free: parsed.data.isFree,
      price: parsed.data.price,
      registration_url: parsed.data.registrationUrl,
      max_attendees: parsed.data.maxAttendees,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .select()
    .single()

  if (error) {
    return failure(`Erreur mise à jour: ${error.message}`)
  }

  // Notify registered users if date or location changed
  if (dateChanged || locationChanged) {
    await notifyEventAttendees(eventId, {
      eventTitle: parsed.data.title,
      dateChanged,
      locationChanged,
      newDate: parsed.data.startDate.toISOString(),
      newLocation: parsed.data.locationName,
    })
  }

  revalidatePath('/marketplace')
  revalidatePath('/dashboard')

  return success(data as EventWithDetails)
}

/**
 * Notify event attendees about changes
 */
async function notifyEventAttendees(
  eventId: string,
  changes: {
    eventTitle: string
    dateChanged: boolean
    locationChanged: boolean
    newDate: string
    newLocation: string
  }
): Promise<void> {
  const supabase = await createSupabaseServer()

  // Get registered attendees (from event_registrations table if it exists)
  // For now, log the notification - will integrate with notification system later
  console.log(`[EVENT UPDATE] Notifying attendees of event ${eventId}:`, changes)

  // TODO: When notification system is ready:
  // 1. Query event_registrations for user_ids
  // 2. Create notification records for each user
  // 3. Send push/email notifications

  // Store change log for audit (table may not exist yet)
  try {
    await supabase.from('event_changes' as never).insert({
      event_id: eventId,
      change_type: changes.dateChanged && changes.locationChanged ? 'date_and_location' : changes.dateChanged ? 'date' : 'location',
      details: JSON.stringify(changes),
      created_at: new Date().toISOString(),
    } as never)
  } catch {
    // Table may not exist yet - that's ok
  }
}

/**
 * Toggle event featured status (promote)
 */
export async function toggleEventFeatured(eventId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return failure('Non authentifié')
  }

  const { data: event } = await supabase
    .from('events')
    .select('is_featured')
    .eq('id', eventId)
    .eq('organizer_id', user.id)
    .single()

  if (!event) {
    return failure('Événement non trouvé')
  }

  const { error } = await supabase
    .from('events')
    .update({ is_featured: !event.is_featured })
    .eq('id', eventId)
    .eq('organizer_id', user.id)

  if (error) {
    return failure('Erreur lors de la mise à jour')
  }

  return success(undefined)
}

/**
 * Get user's registered events
 */
export async function getUserRegisteredEvents(): Promise<EventWithDetails[]> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      registered_at,
      status,
      event:events(
        *,
        category:categories(id, name),
        wilaya:wilayas(id, name)
      )
    `)
    .eq('user_id', user.id)
    .neq('status', 'cancelled')
    .order('registered_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch registered events:', error.message)
    return []
  }

  type RegistrationRow = {
    registered_at: string
    status: string
    event: EventWithDetails
  }

  return ((data as RegistrationRow[] | null) || [])
    .filter(item => item.event)
    .map(item => item.event)
}

/**
 * Register for an event
 */
export async function registerForEvent(eventId: string): Promise<ActionResult<void>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return failure('Non authentifié')
  }

  const { data: existing } = await supabase
    .from('event_registrations')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single()

  if (existing && existing.status !== 'cancelled') {
    return failure('Déjà inscrit')
  }

  const { error } = await supabase
    .from('event_registrations')
    .upsert({
      event_id: eventId,
      user_id: user.id,
      status: 'registered',
      registered_at: new Date().toISOString(),
    } as never)

  if (error) {
    return failure(error.message)
  }

  revalidatePath('/dashboard')
  return success(undefined)
}

/**
 * Cancel event registration
 */
export async function cancelEventRegistration(eventId: string): Promise<ActionResult<void>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return failure('Non authentifié')
  }

  const { error } = await supabase
    .from('event_registrations')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (error) {
    return failure(error.message)
  }

  revalidatePath('/dashboard')
  return success(undefined)
}
