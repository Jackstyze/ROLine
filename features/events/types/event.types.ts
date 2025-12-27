/**
 * Event Types
 */

export type Event = {
  id: string
  organizer_id: string | null
  title: string
  title_ar: string | null
  description: string | null
  category_id: number | null
  start_date: string
  end_date: string | null
  location_name: string
  location_address: string | null
  wilaya_id: number | null
  is_online: boolean
  online_url: string | null
  is_free: boolean
  price: number | null
  registration_url: string | null
  cover_image: string | null
  max_attendees: number | null
  current_attendees: number
  is_active: boolean
  is_featured: boolean
  promotion_tier: 'basic' | 'premium' | 'featured' | null
  promoted_until: string | null
  created_at: string
  updated_at: string
}

export type EventWithDetails = Event & {
  category?: { id: number; name: string } | null
  wilaya?: { id: number; name: string } | null
  organizer?: { id: string; full_name: string } | null
}

export type EventFilters = {
  categoryId?: number
  wilayaId?: number
  isFree?: boolean
  isOnline?: boolean
  startDate?: string
}
