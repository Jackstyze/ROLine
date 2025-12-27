-- Add promotion support for coupons and events

-- Add promotion columns to coupons
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS promotion_tier VARCHAR(20),
  ADD COLUMN IF NOT EXISTS promoted_until TIMESTAMPTZ;

-- Add promotion columns to events (organizer_id already exists for owner)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS promotion_tier VARCHAR(20),
  ADD COLUMN IF NOT EXISTS promoted_until TIMESTAMPTZ;

-- Add coupon_id and event_id to promotion_purchases
ALTER TABLE promotion_purchases
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons,
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events;

-- Update constraint to allow one item per purchase
ALTER TABLE promotion_purchases
  DROP CONSTRAINT IF EXISTS promotion_purchases_product_check;

ALTER TABLE promotion_purchases
  ADD CONSTRAINT promotion_purchases_item_check
  CHECK (
    (product_id IS NOT NULL)::int +
    (coupon_id IS NOT NULL)::int +
    (event_id IS NOT NULL)::int = 1
  );

-- Index for featured coupons
CREATE INDEX IF NOT EXISTS idx_coupons_featured
  ON coupons(is_featured, promoted_until)
  WHERE is_featured = true;

-- Index for featured events
CREATE INDEX IF NOT EXISTS idx_events_featured
  ON events(is_featured, promoted_until)
  WHERE is_featured = true;
