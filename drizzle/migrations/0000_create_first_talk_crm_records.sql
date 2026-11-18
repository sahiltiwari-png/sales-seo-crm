CREATE TABLE public.studio_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  section text NOT NULL CHECK (section IN ('sales', 'seo')),
  record_type text NOT NULL CHECK (record_type IN ('lead', 'contact', 'booking', 'task', 'keyword', 'page')),
  title text NOT NULL,
  company text,
  email text,
  phone text,
  status text NOT NULL DEFAULT 'New',
  amount numeric(12, 2),
  scheduled_at timestamptz,
  url text,
  keyword text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT studio_records_section_type_check CHECK (
    (section = 'sales' AND record_type IN ('lead', 'contact', 'booking', 'task'))
    OR (section = 'seo' AND record_type IN ('task', 'keyword', 'page'))
  )
);

CREATE INDEX studio_records_user_section_idx ON public.studio_records (user_id, section, created_at DESC);
CREATE INDEX studio_records_user_type_idx ON public.studio_records (user_id, record_type, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_records TO authenticated;
GRANT ALL ON public.studio_records TO service_role;

ALTER TABLE public.studio_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accounts can read their own studio records"
  ON public.studio_records FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Accounts can create their own studio records"
  ON public.studio_records FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Accounts can update their own studio records"
  ON public.studio_records FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Accounts can delete their own studio records"
  ON public.studio_records FOR DELETE TO authenticated
  USING (auth.uid() = user_id);