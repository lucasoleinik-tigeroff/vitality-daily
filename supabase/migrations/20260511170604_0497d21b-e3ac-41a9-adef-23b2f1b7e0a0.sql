
-- Starter Protocol seed (idempotent by name)
INSERT INTO public.protocols (name, description, items, target_segment, status)
SELECT 'Starter Protocol',
       'Default daily protocol assigned to every new user.',
       ARRAY[
         'Take supplement capsule with breakfast',
         '10-minute walk today',
         'Drink water before each meal',
         'Lights out by 11pm'
       ],
       'default',
       'published'::content_status
WHERE NOT EXISTS (SELECT 1 FROM public.protocols WHERE name = 'Starter Protocol');

-- Per-user protocol assignment override
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS assigned_protocol_id uuid REFERENCES public.protocols(id) ON DELETE SET NULL;
