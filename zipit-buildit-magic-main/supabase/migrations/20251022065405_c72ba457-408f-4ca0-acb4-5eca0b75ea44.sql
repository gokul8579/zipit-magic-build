-- Add tax fields (CGST, SGST) to quotations
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS cgst_percent numeric DEFAULT 9,
ADD COLUMN IF NOT EXISTS sgst_percent numeric DEFAULT 9;

-- Add tax fields to sales_orders
ALTER TABLE sales_orders 
ADD COLUMN IF NOT EXISTS cgst_percent numeric DEFAULT 9,
ADD COLUMN IF NOT EXISTS sgst_percent numeric DEFAULT 9;

-- Add quotation template preference to company_settings
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS quotation_template text DEFAULT 't1';

-- Add more fields to quotation_items for better tracking
ALTER TABLE quotation_items
ADD COLUMN IF NOT EXISTS cgst_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst_amount numeric DEFAULT 0;

-- Add fields to sales_order_items
ALTER TABLE sales_order_items
ADD COLUMN IF NOT EXISTS cgst_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst_amount numeric DEFAULT 0;