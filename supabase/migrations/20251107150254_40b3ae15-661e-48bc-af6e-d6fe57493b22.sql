-- Add gst_number column to company_settings table
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS gst_number varchar;