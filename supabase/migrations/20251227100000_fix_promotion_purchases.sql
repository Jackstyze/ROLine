-- Fix promotion_purchases table for multi-type promotions
-- product_id should be nullable when promoting coupons or events

-- Make product_id nullable
ALTER TABLE promotion_purchases
  ALTER COLUMN product_id DROP NOT NULL;

-- Add coupon_id and event_id columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'promotion_purchases' AND column_name = 'coupon_id') THEN
    ALTER TABLE promotion_purchases ADD COLUMN coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'promotion_purchases' AND column_name = 'event_id') THEN
    ALTER TABLE promotion_purchases ADD COLUMN event_id UUID REFERENCES events(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add check constraint: at least one item must be specified
ALTER TABLE promotion_purchases DROP CONSTRAINT IF EXISTS check_one_item_required;
ALTER TABLE promotion_purchases ADD CONSTRAINT check_one_item_required
  CHECK (product_id IS NOT NULL OR coupon_id IS NOT NULL OR event_id IS NOT NULL);

-- Add index for coupon and event lookups
CREATE INDEX IF NOT EXISTS idx_promotion_purchases_coupon_id ON promotion_purchases(coupon_id) WHERE coupon_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promotion_purchases_event_id ON promotion_purchases(event_id) WHERE event_id IS NOT NULL;
