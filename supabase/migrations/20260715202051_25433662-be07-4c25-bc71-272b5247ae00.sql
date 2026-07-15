
-- Enums
DO $$ BEGIN
  CREATE TYPE public.material_type AS ENUM ('user_guide', 'better_results', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.material_unlock_type AS ENUM ('immediate', 'log_count');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Products
CREATE TABLE public.materials_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.materials_products TO authenticated;
GRANT ALL ON public.materials_products TO service_role;

ALTER TABLE public.materials_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read active products"
  ON public.materials_products FOR SELECT
  TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage products"
  ON public.materials_products FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER materials_products_touch_updated_at
  BEFORE UPDATE ON public.materials_products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Materials (items)
CREATE TABLE public.materials_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.materials_products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  material_type public.material_type NOT NULL DEFAULT 'other',
  file_url TEXT NOT NULL,
  unlock_type public.material_unlock_type NOT NULL DEFAULT 'immediate',
  unlock_value INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT materials_items_unlock_value_nonneg CHECK (unlock_value >= 0)
);

CREATE INDEX materials_items_product_idx
  ON public.materials_items (product_id, sort_order);

GRANT SELECT ON public.materials_items TO authenticated;
GRANT ALL ON public.materials_items TO service_role;

ALTER TABLE public.materials_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read active materials"
  ON public.materials_items FOR SELECT
  TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage materials"
  ON public.materials_items FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER materials_items_touch_updated_at
  BEFORE UPDATE ON public.materials_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
