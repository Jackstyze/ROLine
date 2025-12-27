-- Add stock quantity to products
-- Products can now track inventory

ALTER TABLE products
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT NULL;

-- NULL means unlimited stock
-- 0 means out of stock
-- positive number means available units

COMMENT ON COLUMN products.stock_quantity IS 'Available stock (NULL = unlimited, 0 = out of stock)';
