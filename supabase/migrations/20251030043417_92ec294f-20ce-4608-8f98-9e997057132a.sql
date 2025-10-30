-- Add brand_color field to company_settings table
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS brand_color VARCHAR DEFAULT '#F9423A';