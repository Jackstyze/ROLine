-- Migration: events
-- Purpose: Events listing for marketplace (MVP Simple - read-only)

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organizer (merchant or admin, NULL = RO Line event)
  organizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Basic info
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  description TEXT,

  -- Category
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,

  -- Date & Time
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,

  -- Location
  location_name VARCHAR(255) NOT NULL,
  location_address TEXT,
  wilaya_id INTEGER REFERENCES wilayas(id),
  is_online BOOLEAN DEFAULT false,
  online_url TEXT,

  -- Pricing
  is_free BOOLEAN DEFAULT true,
  price DECIMAL(10,2),

  -- External registration
  registration_url TEXT,

  -- Media
  cover_image TEXT,

  -- Capacity
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_wilaya ON events(wilaya_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active) WHERE is_active = true;

-- RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Everyone can view active events
CREATE POLICY "Anyone can view active events"
  ON events FOR SELECT
  USING (is_active = true AND start_date >= now() - interval '1 day');

-- Organizers can manage their own events
CREATE POLICY "Organizers can manage own events"
  ON events FOR ALL
  TO authenticated
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

-- Admins can manage all events (via service role)
