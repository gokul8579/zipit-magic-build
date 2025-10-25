-- Create product categories and catalogues tables for dropdowns
CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own categories"
ON public.product_categories
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.product_catalogues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE public.product_catalogues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own catalogues"
ON public.product_catalogues
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add optional foreign keys to auth.users is not allowed directly in code, so we skip FKs to auth.

-- Add deal_id column to quotations to fix insertion from pipeline and quotation forms
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS deal_id uuid NULL;

-- Add FK to deals table for data consistency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quotations_deal_id_fkey'
  ) THEN
    ALTER TABLE public.quotations
      ADD CONSTRAINT quotations_deal_id_fkey
      FOREIGN KEY (deal_id) REFERENCES public.deals (id) ON DELETE SET NULL;
  END IF;
END$$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_product_categories_user_name ON public.product_categories (user_id, name);
CREATE INDEX IF NOT EXISTS idx_product_catalogues_user_name ON public.product_catalogues (user_id, name);
CREATE INDEX IF NOT EXISTS idx_quotations_deal_id ON public.quotations (deal_id);
