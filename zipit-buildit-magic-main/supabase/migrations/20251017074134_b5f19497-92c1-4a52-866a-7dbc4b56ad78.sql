-- Create papers table for document management
CREATE TABLE IF NOT EXISTS public.papers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own papers"
  ON public.papers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own papers"
  ON public.papers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own papers"
  ON public.papers
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for papers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('papers', 'papers', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for papers bucket
CREATE POLICY "Users can view their own papers in storage"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'papers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own papers"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'papers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own papers from storage"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'papers' AND auth.uid()::text = (storage.foldername(name))[1]);