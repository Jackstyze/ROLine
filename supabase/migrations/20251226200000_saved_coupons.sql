-- Migration: saved_coupons
-- Purpose: Table for user's saved coupons wallet

-- Create saved_coupons table
CREATE TABLE IF NOT EXISTS saved_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  used_at TIMESTAMPTZ,
  UNIQUE(user_id, coupon_id)
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_saved_coupons_user_id ON saved_coupons(user_id);

-- RLS policies
ALTER TABLE saved_coupons ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved coupons
CREATE POLICY "Users can view own saved coupons"
  ON saved_coupons FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can save coupons to their wallet
CREATE POLICY "Users can save coupons"
  ON saved_coupons FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove saved coupons
CREATE POLICY "Users can remove saved coupons"
  ON saved_coupons FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow merchant_id to be NULL for admin-created global coupons
ALTER TABLE coupons ALTER COLUMN merchant_id DROP NOT NULL;
