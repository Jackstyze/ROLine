-- Coupon System Migration
-- Unified coupon system for products, events, services, premium access

-- 1. Main coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- null = admin/platform coupon

  -- Identification
  code VARCHAR(50) UNIQUE,
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  description TEXT,

  -- Discount type
  discount_type VARCHAR(20) NOT NULL CHECK (
    discount_type IN ('percentage', 'fixed_amount', 'free_shipping', 'access_unlock')
  ),
  discount_value DECIMAL(10,2),

  -- Multi-context applicability
  applies_to VARCHAR(20) NOT NULL DEFAULT 'products' CHECK (
    applies_to IN ('products', 'events', 'premium_access', 'delivery', 'ride_share', 'all')
  ),

  -- Target audience
  target_audience VARCHAR(20) DEFAULT 'all' CHECK (
    target_audience IN ('all', 'students', 'merchants', 'specific_users')
  ),

  -- Time limits
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,

  -- Usage limits
  max_total_uses INTEGER,
  max_uses_per_user INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,

  -- Conditions
  min_purchase_amount DECIMAL(10,2),

  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Coupon rules for granular targeting
CREATE TABLE IF NOT EXISTS coupon_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,

  rule_type VARCHAR(20) NOT NULL CHECK (
    rule_type IN ('category', 'specific_products', 'specific_events', 'wilaya', 'merchant')
  ),

  target_ids JSONB,
  target_wilayas JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Coupon usage tracking
CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  used_on VARCHAR(20) NOT NULL CHECK (
    used_on IN ('product', 'event', 'service')
  ),
  target_id UUID,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coupons_merchant ON coupons(merchant_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_coupon_rules_coupon ON coupon_rules(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user ON coupon_usages(user_id);

-- Function to increment coupon usage
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_coupon_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE coupons
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = p_coupon_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

-- Merchants can manage their own coupons
CREATE POLICY "Merchants manage own coupons" ON coupons
  FOR ALL USING (auth.uid() = merchant_id);

-- Public active coupons visible to authenticated users
CREATE POLICY "View public active coupons" ON coupons
  FOR SELECT USING (
    is_public = true
    AND is_active = true
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );

-- Coupon rules visible with coupon
CREATE POLICY "View coupon rules" ON coupon_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coupons
      WHERE coupons.id = coupon_rules.coupon_id
      AND (coupons.merchant_id = auth.uid() OR coupons.is_public = true)
    )
  );

-- Merchants manage their coupon rules
CREATE POLICY "Merchants manage coupon rules" ON coupon_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM coupons
      WHERE coupons.id = coupon_rules.coupon_id
      AND coupons.merchant_id = auth.uid()
    )
  );

-- Users can see their own usage
CREATE POLICY "Users view own usage" ON coupon_usages
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert usage (via service role)
CREATE POLICY "Insert coupon usage" ON coupon_usages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add coupon reference to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
