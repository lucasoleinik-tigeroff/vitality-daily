
-- ============ ENUMS ============
create type public.app_role as enum ('admin', 'user');
create type public.activity_level as enum ('sedentary', 'lightly_active', 'moderately_active', 'very_active');
create type public.sleep_quality as enum ('poor', 'ok', 'great');
create type public.stress_level as enum ('low', 'medium', 'high');
create type public.score_status as enum ('improving', 'stable', 'needs_attention');
create type public.content_status as enum ('draft', 'published');
create type public.user_status as enum ('active', 'suspended', 'deleted');

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  age integer,
  height_feet integer,
  height_inches integer,
  weight_lbs numeric,
  waist_inches numeric,
  activity_level public.activity_level,
  main_concern text,
  main_goal text,
  current_habits text[] default '{}',
  journey_start_date date default current_date,
  streak_count integer not null default 0,
  last_log_date date,
  onboarding_completed boolean not null default false,
  status public.user_status not null default 'active',
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ USER ROLES (secure pattern) ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- ============ HEALTH METRICS HISTORY ============
create table public.user_health_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date timestamptz not null default now(),
  weight_lbs numeric not null,
  waist_inches numeric not null,
  activity_level public.activity_level not null,
  bmi numeric not null,
  bmi_category text not null,
  bmr_kcal integer not null,
  tdee_kcal integer not null,
  hydration_target_oz integer not null,
  hr_max integer not null,
  hr_moderate_low integer not null,
  hr_moderate_high integer not null,
  hr_vigorous_low integer not null,
  hr_vigorous_high integer not null,
  waist_risk_category text not null,
  created_at timestamptz not null default now()
);
create index on public.user_health_metrics(user_id, snapshot_date desc);

-- ============ DAILY LOGS ============
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  sleep_hours numeric,
  sleep_quality public.sleep_quality,
  stress_level public.stress_level,
  activity_minutes integer default 0,
  activity_type text,
  hydration_oz integer default 0,
  supplement_taken boolean default false,
  supplement_time text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);
create index on public.daily_logs(user_id, log_date desc);

-- ============ VITALITY SCORES ============
create table public.vitality_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score_date date not null,
  score integer not null check (score between 0 and 100),
  status public.score_status not null default 'stable',
  created_at timestamptz not null default now(),
  unique (user_id, score_date)
);
create index on public.vitality_scores(user_id, score_date desc);

-- ============ PROTOCOLS ============
create table public.protocols (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  items text[] not null default '{}',
  target_segment text,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.protocol_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  protocol_id uuid not null references public.protocols(id) on delete cascade,
  completion_date date not null,
  completed_items integer[] not null default '{}',
  total_items integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, completion_date)
);

-- ============ EBOOKS ============
create table public.ebooks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  tags text[] default '{}',
  file_url text,
  cover_url text,
  publish_date date default current_date,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ebook_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ebook_id uuid not null references public.ebooks(id) on delete cascade,
  accessed_at timestamptz not null default now()
);

-- ============ COACH CONTENT ============
create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  target_week integer,
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coach_tips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  target_metric text not null default 'general',
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coach_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_message text not null,
  coach_response text not null,
  response_source text not null default 'pre_written',
  tokens_used integer,
  created_at timestamptz not null default now()
);
create index on public.coach_conversations(user_id, created_at desc);

-- ============ ADMIN LOGS ============
create table public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

-- ============ APP CONFIG ============
create table public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_config (key, value) values
  ('ai_coach_enabled', 'false'::jsonb),
  ('ai_provider', '"openai"'::jsonb),
  ('ai_model', '"gpt-5-mini"'::jsonb),
  ('ai_cost_per_1k_tokens', '0.001'::jsonb);

-- ============ AUTO-CREATE PROFILE TRIGGER ============
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ UPDATED_AT TRIGGER ============
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger touch_daily_logs before update on public.daily_logs
  for each row execute function public.touch_updated_at();
create trigger touch_protocols before update on public.protocols
  for each row execute function public.touch_updated_at();
create trigger touch_ebooks before update on public.ebooks
  for each row execute function public.touch_updated_at();
create trigger touch_coach_messages before update on public.coach_messages
  for each row execute function public.touch_updated_at();
create trigger touch_coach_tips before update on public.coach_tips
  for each row execute function public.touch_updated_at();

-- ============ ENABLE RLS ============
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_health_metrics enable row level security;
alter table public.daily_logs enable row level security;
alter table public.vitality_scores enable row level security;
alter table public.protocols enable row level security;
alter table public.protocol_completions enable row level security;
alter table public.ebooks enable row level security;
alter table public.ebook_access enable row level security;
alter table public.coach_messages enable row level security;
alter table public.coach_tips enable row level security;
alter table public.coach_conversations enable row level security;
alter table public.admin_logs enable row level security;
alter table public.app_config enable row level security;

-- ============ POLICIES: PROFILES ============
create policy "Users view own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "Users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id);
create policy "Admins view all profiles" on public.profiles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update all profiles" on public.profiles
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ============ POLICIES: USER ROLES ============
create policy "Users view own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid());
create policy "Admins manage roles" on public.user_roles
  for all to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ============ POLICIES: HEALTH METRICS ============
create policy "Users view own metrics" on public.user_health_metrics
  for select to authenticated using (user_id = auth.uid());
create policy "Users insert own metrics" on public.user_health_metrics
  for insert to authenticated with check (user_id = auth.uid());
create policy "Admins view all metrics" on public.user_health_metrics
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ============ POLICIES: DAILY LOGS ============
create policy "Users manage own logs" on public.daily_logs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Admins view logs" on public.daily_logs
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ============ POLICIES: VITALITY SCORES ============
create policy "Users manage own scores" on public.vitality_scores
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Admins view scores" on public.vitality_scores
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ============ POLICIES: PROTOCOLS ============
create policy "Anyone authenticated reads published protocols" on public.protocols
  for select to authenticated using (status = 'published' or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage protocols" on public.protocols
  for all to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "Users manage own completions" on public.protocol_completions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Admins view completions" on public.protocol_completions
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ============ POLICIES: EBOOKS ============
create policy "Authenticated reads published ebooks" on public.ebooks
  for select to authenticated using (status = 'published' or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage ebooks" on public.ebooks
  for all to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "Users manage own ebook access" on public.ebook_access
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Admins view ebook access" on public.ebook_access
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ============ POLICIES: COACH ============
create policy "Authenticated reads published messages" on public.coach_messages
  for select to authenticated using (status = 'published' or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage messages" on public.coach_messages
  for all to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "Authenticated reads published tips" on public.coach_tips
  for select to authenticated using (status = 'published' or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage tips" on public.coach_tips
  for all to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "Users view own conversations" on public.coach_conversations
  for select to authenticated using (user_id = auth.uid());
create policy "Users insert own conversations" on public.coach_conversations
  for insert to authenticated with check (user_id = auth.uid());
create policy "Admins view all conversations" on public.coach_conversations
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ============ POLICIES: ADMIN LOGS ============
create policy "Admins view logs" on public.admin_logs
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins insert logs" on public.admin_logs
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));

-- ============ POLICIES: APP CONFIG ============
create policy "Authenticated read config" on public.app_config
  for select to authenticated using (true);
create policy "Admins update config" on public.app_config
  for all to authenticated using (public.has_role(auth.uid(), 'admin'));
