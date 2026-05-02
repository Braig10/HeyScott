-- ═══════════════════════════════════════════════════════════
-- HeyScott — Full schema
-- Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ─── Tables ──────────────────────────────────────────────────

create table if not exists companies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz default now()
);

create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  company_id    uuid references companies(id),
  role          text not null default 'individual',  -- individual | learner | manager
  name          text,
  email         text,
  focus         text,
  challenge     text,
  own_challenge text,
  experience    text,
  billings      text,
  biggest_win   text,
  updated_at    timestamptz default now()
);

create table if not exists lesson_completions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  company_id   uuid references companies(id),
  lesson_id    int  not null,
  module_id    int  not null,
  completed_at timestamptz default now(),
  unique(user_id, lesson_id)
);

create table if not exists roleplays (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  company_id    uuid references companies(id),
  scenario_key  text,
  score         int,
  feedback      text,
  transcript    text,
  analysis_json jsonb,
  saved_at      timestamptz default now()
);

create table if not exists reflections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  company_id uuid references companies(id),
  prompt     text,
  response   text,
  learner    text,
  saved_at   timestamptz default now()
);

create table if not exists smart_goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  goals_json   jsonb,
  generated_at timestamptz default now(),
  unique(user_id)
);

create table if not exists energy_checkins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  company_id uuid references companies(id),
  user_name  text,
  energy     int,
  checked_at timestamptz default now()
);

create table if not exists confidence_checks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  company_id uuid references companies(id),
  user_name  text,
  score      numeric,
  check_type text,
  checked_at timestamptz default now()
);

create table if not exists manager_inbox (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid references companies(id),
  from_user_id uuid references profiles(id),
  from_name    text,
  type         text,
  payload      jsonb,
  read         boolean default false,
  created_at   timestamptz default now()
);

-- ─── Row Level Security ──────────────────────────────────────

alter table companies          enable row level security;
alter table profiles           enable row level security;
alter table lesson_completions enable row level security;
alter table roleplays          enable row level security;
alter table reflections        enable row level security;
alter table smart_goals        enable row level security;
alter table energy_checkins    enable row level security;
alter table confidence_checks  enable row level security;
alter table manager_inbox      enable row level security;

-- companies
create policy "Members view own company"
  on companies for select
  using (exists (select 1 from profiles where id = auth.uid() and company_id = companies.id));

create policy "Authenticated users can create company"
  on companies for insert to authenticated
  with check (true);

-- profiles
create policy "Users view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Managers view team profiles"
  on profiles for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'manager'
        and p.company_id = profiles.company_id and p.company_id is not null
    )
  );

create policy "Users insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update using (auth.uid() = id);

-- lesson_completions
create policy "Users own completions"
  on lesson_completions for all using (auth.uid() = user_id);

create policy "Managers view team completions"
  on lesson_completions for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'manager' and company_id = lesson_completions.company_id)
  );

-- roleplays
create policy "Users own roleplays"
  on roleplays for all using (auth.uid() = user_id);

create policy "Managers view team roleplays"
  on roleplays for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'manager' and company_id = roleplays.company_id)
  );

-- reflections
create policy "Users own reflections"
  on reflections for all using (auth.uid() = user_id);

create policy "Managers view team reflections"
  on reflections for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'manager' and company_id = reflections.company_id)
  );

-- smart_goals
create policy "Users own goals"
  on smart_goals for all using (auth.uid() = user_id);

-- energy_checkins
create policy "Users own energy"
  on energy_checkins for all using (auth.uid() = user_id);

create policy "Managers view team energy"
  on energy_checkins for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'manager' and company_id = energy_checkins.company_id)
  );

-- confidence_checks
create policy "Users own confidence"
  on confidence_checks for all using (auth.uid() = user_id);

create policy "Managers view team confidence"
  on confidence_checks for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'manager' and company_id = confidence_checks.company_id)
  );

-- manager_inbox
create policy "Managers manage inbox"
  on manager_inbox for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'manager' and company_id = manager_inbox.company_id)
  );

create policy "Users send to inbox"
  on manager_inbox for insert with check (auth.uid() = from_user_id);

-- ─── Auth trigger: auto-create profile on signup ─────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role, company_id)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'individual'),
    nullif(new.raw_user_meta_data->>'company_id', '')::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
