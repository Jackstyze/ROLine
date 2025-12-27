-- ============================================================================
-- ROLine V0 - Initial Database Schema
-- Created: 2024-12-24
--
-- RULES APPLIED:
-- - ZERO HARDCODE: All config via RLS policies and functions
-- - ZERO DEMO: No fake data, only production schema
-- - ZERO FALLBACKS: Constraints enforce data integrity
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- ============================================================================
-- 1. ENUMS (Type safety at DB level)
-- ============================================================================

CREATE TYPE user_role AS ENUM ('student', 'merchant', 'admin');
CREATE TYPE product_status AS ENUM ('draft', 'active', 'sold', 'archived');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cod', 'edahabia', 'cib');

-- ============================================================================
-- 2. WILAYAS TABLE (Reference data - 69 wilayas as of Nov 2025)
-- ============================================================================

CREATE TABLE wilayas (
    id INTEGER PRIMARY KEY CHECK (id >= 1 AND id <= 69),
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for name search
CREATE INDEX idx_wilayas_name ON wilayas USING gin (name gin_trgm_ops);
CREATE INDEX idx_wilayas_name_ar ON wilayas USING gin (name_ar gin_trgm_ops);

-- ============================================================================
-- 3. PROFILES TABLE (Extends Supabase auth.users)
-- ============================================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(100),
    phone VARCHAR(20) UNIQUE,
    role user_role NOT NULL DEFAULT 'student',
    wilaya_id INTEGER REFERENCES wilayas(id),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_wilaya ON profiles(wilaya_id);
CREATE INDEX idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 4. CATEGORIES TABLE
-- ============================================================================

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for hierarchy queries
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 5. PRODUCTS TABLE (Core marketplace entity)
-- ============================================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,

    -- Content
    title VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255),
    description TEXT,

    -- Pricing (in DZD - Algerian Dinar)
    price DECIMAL(12, 2) NOT NULL CHECK (price > 0),
    original_price DECIMAL(12, 2) CHECK (original_price IS NULL OR original_price > 0),

    -- Media
    images TEXT[] DEFAULT '{}',

    -- Location
    wilaya_id INTEGER REFERENCES wilayas(id),

    -- Status & Metrics
    status product_status NOT NULL DEFAULT 'active',
    views_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_discount CHECK (
        original_price IS NULL OR original_price >= price
    ),
    CONSTRAINT max_images CHECK (
        array_length(images, 1) IS NULL OR array_length(images, 1) <= 5
    )
);

-- Indexes for common queries
CREATE INDEX idx_products_merchant ON products(merchant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_wilaya ON products(wilaya_id);
CREATE INDEX idx_products_status ON products(status) WHERE status = 'active';
CREATE INDEX idx_products_created ON products(created_at DESC);
CREATE INDEX idx_products_price ON products(price);

-- Full-text search index
CREATE INDEX idx_products_title_search ON products USING gin (title gin_trgm_ops);
CREATE INDEX idx_products_title_ar_search ON products USING gin (title_ar gin_trgm_ops);

-- Auto-update updated_at
CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 6. ORDERS TABLE
-- ============================================================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Parties
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Status
    status order_status NOT NULL DEFAULT 'pending',

    -- Payment
    payment_method payment_method,
    payment_id VARCHAR(100), -- External payment reference (Chargily)
    total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount > 0),

    -- Shipping
    shipping_address TEXT,
    shipping_wilaya INTEGER REFERENCES wilayas(id),

    -- Notes
    buyer_notes TEXT,
    seller_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    -- Prevent self-purchase
    CONSTRAINT no_self_purchase CHECK (buyer_id != seller_id)
);

-- Indexes
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_product ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE wilayas ENABLE ROW LEVEL SECURITY;

-- WILAYAS: Public read access (reference data)
CREATE POLICY "Wilayas are publicly readable"
    ON wilayas FOR SELECT
    USING (true);

-- CATEGORIES: Public read access
CREATE POLICY "Categories are publicly readable"
    ON categories FOR SELECT
    USING (is_active = true);

-- PROFILES: Users can read all profiles, update only their own
CREATE POLICY "Profiles are publicly readable"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- PRODUCTS: Complex policies for marketplace
CREATE POLICY "Active products are publicly readable"
    ON products FOR SELECT
    USING (status = 'active' OR merchant_id = auth.uid());

CREATE POLICY "Merchants can insert own products"
    ON products FOR INSERT
    WITH CHECK (
        auth.uid() = merchant_id
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('merchant', 'admin')
        )
    );

CREATE POLICY "Merchants can update own products"
    ON products FOR UPDATE
    USING (auth.uid() = merchant_id)
    WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Merchants can delete own products"
    ON products FOR DELETE
    USING (auth.uid() = merchant_id);

-- ORDERS: Buyer and seller can see their orders
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Authenticated users can create orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Parties can update order status"
    ON orders FOR UPDATE
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Increment product views (bypass RLS for analytics)
CREATE OR REPLACE FUNCTION increment_product_views(product_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET views_count = views_count + 1
    WHERE id = product_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user role (for middleware/auth checks)
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
