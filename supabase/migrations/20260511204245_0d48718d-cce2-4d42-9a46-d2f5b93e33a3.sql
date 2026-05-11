-- Add accessed_on generated date column + unique daily index for guide_access
ALTER TABLE public.guide_access
  ADD COLUMN IF NOT EXISTS accessed_on date GENERATED ALWAYS AS ((accessed_at AT TIME ZONE 'UTC')::date) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS guide_access_user_guide_day_uniq
  ON public.guide_access (user_id, guide_id, accessed_on);

-- Helpful indexes for admin views
CREATE INDEX IF NOT EXISTS admin_logs_created_at_idx ON public.admin_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_logs_admin_user_idx ON public.admin_logs (admin_user_id);