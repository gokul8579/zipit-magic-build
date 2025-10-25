-- Create papers table for document management
CREATE TABLE public.papers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own papers
CREATE POLICY "Users can manage their own papers"
ON public.papers
FOR ALL
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_papers_updated_at
BEFORE UPDATE ON public.papers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for papers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('papers', 'papers', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for papers
CREATE POLICY "Users can view their own papers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'papers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own papers"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'papers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own papers"
ON storage.objects
FOR DELETE
USING (bucket_id = 'papers' AND auth.uid()::text = (storage.foldername(name))[1]);