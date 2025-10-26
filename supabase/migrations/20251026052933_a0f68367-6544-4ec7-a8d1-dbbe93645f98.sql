-- Add weight fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_unit VARCHAR DEFAULT 'kg';