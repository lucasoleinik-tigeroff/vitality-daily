
ALTER TYPE public.content_status ADD VALUE IF NOT EXISTS 'coming_soon';

ALTER TABLE public.ebooks RENAME TO guides;
ALTER TABLE public.ebook_access RENAME TO guide_access;
ALTER TABLE public.guide_access RENAME COLUMN ebook_id TO guide_id;

ALTER TABLE public.guides
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'pdf' CHECK (content_type IN ('pdf','link','text')),
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS body_text text,
  ADD COLUMN IF NOT EXISTS unlock_day integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.user_journey_day(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(1, (CURRENT_DATE - COALESCE(journey_start_date, CURRENT_DATE))::int + 1)
  FROM public.profiles WHERE id = _user_id
$$;

CREATE TABLE IF NOT EXISTS public.coach_tip_shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tip_id uuid NOT NULL REFERENCES public.coach_tips(id) ON DELETE CASCADE,
  shown_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_coach_tip_shows_user_time ON public.coach_tip_shows(user_id, shown_at DESC);

CREATE TABLE IF NOT EXISTS public.cross_sell_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concern text UNIQUE NOT NULL CHECK (concern IN ('sleep_recovery','stress_cognitive','metabolism_weight','hydration_metabolism','amplify')),
  product_name text NOT NULL DEFAULT '',
  headline text NOT NULL DEFAULT '',
  body_text text NOT NULL DEFAULT '',
  cta_url text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cross_sell_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  concern text NOT NULL,
  product_id uuid REFERENCES public.cross_sell_products(id) ON DELETE SET NULL,
  shown_at timestamptz NOT NULL DEFAULT now(),
  clicked boolean NOT NULL DEFAULT false,
  clicked_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_cross_sell_impressions_user ON public.cross_sell_impressions(user_id, shown_at DESC);

CREATE TABLE IF NOT EXISTS public.phase2_notifications_sent (
  user_id uuid PRIMARY KEY,
  sent_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_tip_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_sell_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_sell_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase2_notifications_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own tip shows" ON public.coach_tip_shows
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users view own tip shows" ON public.coach_tip_shows
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view all tip shows" ON public.coach_tip_shows
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE POLICY "Authenticated read cross sell products" ON public.cross_sell_products
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage cross sell products" ON public.cross_sell_products
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE POLICY "Users insert own impressions" ON public.cross_sell_impressions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own impressions" ON public.cross_sell_impressions
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users view own impressions" ON public.cross_sell_impressions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view all impressions" ON public.cross_sell_impressions
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE POLICY "Users manage own phase2 notifications" ON public.phase2_notifications_sent
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

INSERT INTO storage.buckets (id, name, public) VALUES ('guides','guides',false)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('guide_covers','guide_covers',true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins manage guides bucket" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id='guides' AND has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id='guides' AND has_role(auth.uid(),'admin'));

CREATE POLICY "Authenticated read unlocked guide files" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id='guides'
    AND EXISTS (
      SELECT 1 FROM public.guides g
      WHERE (storage.foldername(storage.objects.name))[1] = g.id::text
        AND g.status = 'published'
        AND g.unlock_day <= public.user_journey_day(auth.uid())
    )
  );

CREATE POLICY "Public read guide covers" ON storage.objects
  FOR SELECT USING (bucket_id='guide_covers');
CREATE POLICY "Admins manage guide covers" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id='guide_covers' AND has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id='guide_covers' AND has_role(auth.uid(),'admin'));

INSERT INTO public.cross_sell_products (concern, product_name, headline, body_text, cta_url, active) VALUES
  ('sleep_recovery','Sleep & Recovery Formula','Reclaim deep, restorative sleep','Your last 14 days show short or low-quality sleep. This formula targets recovery and overnight repair.','',false),
  ('stress_cognitive','Stress & Cognitive Support','Calm the noise, sharpen focus','Your stress pattern is consistently elevated. This blend supports a calmer baseline and clearer thinking.','',false),
  ('metabolism_weight','Metabolism & Weight Support','Reignite your metabolism','Activity has been low for two weeks. This support helps your body respond when you start moving more.','',false),
  ('hydration_metabolism','Hydration & Daily Vitality','Rehydrate and restore','Hydration has been below target. This daily support replenishes electrolytes and metabolic fuel.','',false),
  ('amplify','Vitality Amplifier','Take your momentum further','You are on a strong track. This amplifier compounds the gains you have already built.','',false)
ON CONFLICT (concern) DO NOTHING;
