-- Add invoice settings fields to company_settings table
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS show_gst_number boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_cin_number boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_tax_id boolean DEFAULT true;