-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  image text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view notifications
CREATE POLICY "Everyone can view notifications"
  ON public.notifications FOR SELECT
  USING (true);

-- Policy: Service Role (Backend) can insert
-- Note: Service role bypasses RLS
