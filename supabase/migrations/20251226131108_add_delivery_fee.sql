-- Add delivery_fee column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_fee INTEGER DEFAULT 0;

-- Add comment
COMMENT ON COLUMN products.delivery_fee IS 'Delivery fee in DZD (Algerian Dinars)';
