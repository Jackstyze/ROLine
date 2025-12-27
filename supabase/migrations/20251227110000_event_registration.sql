-- Event registration system
-- Implements current_attendees tracking

-- Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  UNIQUE(event_id, user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);

-- Enable RLS
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Users can see their own registrations
CREATE POLICY "Users can view own registrations"
  ON event_registrations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can register for events
CREATE POLICY "Users can register for events"
  ON event_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can cancel their registrations
CREATE POLICY "Users can cancel registrations"
  ON event_registrations FOR UPDATE
  USING (auth.uid() = user_id);

-- Event organizers can see all registrations
CREATE POLICY "Organizers can view event registrations"
  ON event_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Function to register for event with capacity check
CREATE OR REPLACE FUNCTION register_for_event(p_event_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event events%ROWTYPE;
  v_user_id UUID := auth.uid();
  v_registration_id UUID;
BEGIN
  -- Get event with lock
  SELECT * INTO v_event
  FROM events
  WHERE id = p_event_id
  FOR UPDATE;

  IF v_event.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Event not found');
  END IF;

  IF NOT v_event.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Event is not active');
  END IF;

  -- Check capacity
  IF v_event.max_attendees IS NOT NULL
     AND v_event.current_attendees >= v_event.max_attendees THEN
    RETURN json_build_object('success', false, 'error', 'Event is full');
  END IF;

  -- Check if already registered
  IF EXISTS (
    SELECT 1 FROM event_registrations
    WHERE event_id = p_event_id AND user_id = v_user_id AND status = 'registered'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Already registered');
  END IF;

  -- Insert registration
  INSERT INTO event_registrations (event_id, user_id)
  VALUES (p_event_id, v_user_id)
  ON CONFLICT (event_id, user_id) DO UPDATE
  SET status = 'registered', cancelled_at = NULL, registered_at = NOW()
  RETURNING id INTO v_registration_id;

  -- Increment attendee count
  UPDATE events
  SET current_attendees = COALESCE(current_attendees, 0) + 1
  WHERE id = p_event_id;

  RETURN json_build_object(
    'success', true,
    'registration_id', v_registration_id
  );
END;
$$;

-- Function to cancel registration
CREATE OR REPLACE FUNCTION cancel_event_registration(p_event_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_registration event_registrations%ROWTYPE;
BEGIN
  -- Get and lock registration
  SELECT * INTO v_registration
  FROM event_registrations
  WHERE event_id = p_event_id AND user_id = v_user_id
  FOR UPDATE;

  IF v_registration.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not registered');
  END IF;

  IF v_registration.status = 'cancelled' THEN
    RETURN json_build_object('success', false, 'error', 'Already cancelled');
  END IF;

  -- Update registration
  UPDATE event_registrations
  SET status = 'cancelled', cancelled_at = NOW()
  WHERE id = v_registration.id;

  -- Decrement attendee count
  UPDATE events
  SET current_attendees = GREATEST(COALESCE(current_attendees, 1) - 1, 0)
  WHERE id = p_event_id;

  RETURN json_build_object('success', true);
END;
$$;
