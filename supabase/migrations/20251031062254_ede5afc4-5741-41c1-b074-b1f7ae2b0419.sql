-- Add company_type and cin_number fields to company_settings
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS company_type VARCHAR,
ADD COLUMN IF NOT EXISTS cin_number VARCHAR;

-- Add payment_status field to sales_orders
ALTER TABLE sales_orders
ADD COLUMN IF NOT EXISTS payment_status VARCHAR DEFAULT 'pending';