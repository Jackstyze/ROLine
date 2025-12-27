-- ============================================================================
-- Add promotion support to products
-- ============================================================================

-- Add promotion fields to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_promoted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS promoted_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS promotion_tier TEXT CHECK (promotion_tier IN ('basic', 'premium', 'featured'));

-- Create promotion packages table
CREATE TABLE IF NOT EXISTS promotion_packages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('basic', 'premium', 'featured')),
    duration_days INTEGER NOT NULL,
    price INTEGER NOT NULL, -- Price in DZD
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create promotion purchases table
CREATE TABLE IF NOT EXISTS promotion_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    package_id INTEGER NOT NULL REFERENCES promotion_packages(id),
    amount INTEGER NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_ref TEXT,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed promotion packages (6 options)
INSERT INTO promotion_packages (name, name_ar, tier, duration_days, price, description) VALUES
('Basic 7j', 'أساسي 7 أيام', 'basic', 7, 500, 'Visibilité améliorée pendant 7 jours'),
('Basic 30j', 'أساسي 30 يوم', 'basic', 30, 1500, 'Visibilité améliorée pendant 30 jours'),
('Premium 7j', 'متميز 7 أيام', 'premium', 7, 1000, 'Mise en avant dans les résultats'),
('Premium 30j', 'متميز 30 يوم', 'premium', 30, 3000, 'Mise en avant dans les résultats'),
('Featured 7j', 'مميز 7 أيام', 'featured', 7, 2000, 'Affiché sur la page d''accueil'),
('Featured 30j', 'مميز 30 يوم', 'featured', 30, 5000, 'Affiché sur la page d''accueil')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE promotion_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active packages" ON promotion_packages
    FOR SELECT USING (is_active = true);

CREATE POLICY "Merchants can view their purchases" ON promotion_purchases
    FOR SELECT USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can create purchases" ON promotion_purchases
    FOR INSERT WITH CHECK (auth.uid() = merchant_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_promoted ON products(is_promoted, promoted_until) WHERE is_promoted = true;
CREATE INDEX IF NOT EXISTS idx_promotion_purchases_merchant ON promotion_purchases(merchant_id);
