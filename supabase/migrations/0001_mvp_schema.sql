create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.body_parts (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name_ko text not null,
  color_hex text not null,
  display_order integer not null
);

create table if not exists public.exercise_definitions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  primary_body_part_id uuid not null references public.body_parts (id),
  exercise_type text not null check (exercise_type in ('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other')),
  is_system boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists exercise_definitions_owner_name_idx
  on public.exercise_definitions (coalesce(owner_user_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

create table if not exists public.brand_definitions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists brand_definitions_owner_name_idx
  on public.brand_definitions (coalesce(owner_user_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

create table if not exists public.machine_definitions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users (id) on delete cascade,
  brand_id uuid references public.brand_definitions (id),
  brand_name_fallback text,
  name text not null,
  primary_body_part_id uuid references public.body_parts (id),
  is_system boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint machine_brand_presence check (brand_id is not null or brand_name_fallback is not null)
);

create unique index if not exists machine_definitions_owner_name_idx
  on public.machine_definitions (coalesce(owner_user_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

create table if not exists public.machine_setting_templates (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machine_definitions (id) on delete cascade,
  field_key text not null,
  field_label text not null,
  field_type text not null check (field_type in ('dropdown', 'number', 'text')),
  options_json jsonb,
  sort_order integer not null default 1,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists machine_setting_templates_machine_field_key_idx
  on public.machine_setting_templates (machine_id, field_key);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_date date not null,
  title text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists workout_sessions_user_date_idx
  on public.workout_sessions (user_id, session_date desc);

create table if not exists public.workout_session_body_parts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  body_part_id uuid not null references public.body_parts (id) on delete restrict
);

create unique index if not exists workout_session_body_parts_unique_idx
  on public.workout_session_body_parts (session_id, body_part_id);

create table if not exists public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_definition_id uuid not null references public.exercise_definitions (id) on delete restrict,
  machine_id uuid references public.machine_definitions (id) on delete set null,
  order_index integer not null default 1,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists session_exercises_session_order_idx
  on public.session_exercises (session_id, order_index);

create table if not exists public.session_exercise_setting_values (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references public.session_exercises (id) on delete cascade,
  template_id uuid not null references public.machine_setting_templates (id) on delete cascade,
  value_text text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists session_exercise_setting_values_unique_idx
  on public.session_exercise_setting_values (session_exercise_id, template_id);

create table if not exists public.session_exercise_sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references public.session_exercises (id) on delete cascade,
  set_number integer not null,
  weight_value numeric(8,2),
  reps integer,
  is_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists session_exercise_sets_unique_idx
  on public.session_exercise_sets (session_exercise_id, set_number);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

create trigger set_exercise_definitions_updated_at
before update on public.exercise_definitions
for each row
execute procedure public.set_updated_at();

create trigger set_machine_definitions_updated_at
before update on public.machine_definitions
for each row
execute procedure public.set_updated_at();

create trigger set_workout_sessions_updated_at
before update on public.workout_sessions
for each row
execute procedure public.set_updated_at();

create trigger set_session_exercises_updated_at
before update on public.session_exercises
for each row
execute procedure public.set_updated_at();

create trigger set_session_exercise_sets_updated_at
before update on public.session_exercise_sets
for each row
execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, new.raw_user_meta_data ->> 'nickname')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.body_parts enable row level security;
alter table public.exercise_definitions enable row level security;
alter table public.brand_definitions enable row level security;
alter table public.machine_definitions enable row level security;
alter table public.machine_setting_templates enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_session_body_parts enable row level security;
alter table public.session_exercises enable row level security;
alter table public.session_exercise_setting_values enable row level security;
alter table public.session_exercise_sets enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "body_parts_read_all"
on public.body_parts
for select
using (true);

create policy "exercise_read_visible"
on public.exercise_definitions
for select
using (is_system = true or owner_user_id = auth.uid());

create policy "exercise_insert_custom"
on public.exercise_definitions
for insert
with check (owner_user_id = auth.uid() and is_system = false);

create policy "exercise_update_custom"
on public.exercise_definitions
for update
using (owner_user_id = auth.uid() and is_system = false)
with check (owner_user_id = auth.uid() and is_system = false);

create policy "exercise_delete_custom"
on public.exercise_definitions
for delete
using (owner_user_id = auth.uid() and is_system = false);

create policy "brand_read_visible"
on public.brand_definitions
for select
using (is_system = true or owner_user_id = auth.uid());

create policy "brand_insert_custom"
on public.brand_definitions
for insert
with check (owner_user_id = auth.uid() and is_system = false);

create policy "brand_update_custom"
on public.brand_definitions
for update
using (owner_user_id = auth.uid() and is_system = false)
with check (owner_user_id = auth.uid() and is_system = false);

create policy "brand_delete_custom"
on public.brand_definitions
for delete
using (owner_user_id = auth.uid() and is_system = false);

create policy "machine_read_visible"
on public.machine_definitions
for select
using (is_system = true or owner_user_id = auth.uid());

create policy "machine_insert_custom"
on public.machine_definitions
for insert
with check (owner_user_id = auth.uid() and is_system = false);

create policy "machine_update_custom"
on public.machine_definitions
for update
using (owner_user_id = auth.uid() and is_system = false)
with check (owner_user_id = auth.uid() and is_system = false);

create policy "machine_delete_custom"
on public.machine_definitions
for delete
using (owner_user_id = auth.uid() and is_system = false);

create policy "machine_template_read_visible"
on public.machine_setting_templates
for select
using (
  exists (
    select 1
    from public.machine_definitions machines
    where machines.id = machine_setting_templates.machine_id
      and (machines.is_system = true or machines.owner_user_id = auth.uid())
  )
);

create policy "machine_template_insert_custom"
on public.machine_setting_templates
for insert
with check (
  exists (
    select 1
    from public.machine_definitions machines
    where machines.id = machine_setting_templates.machine_id
      and machines.owner_user_id = auth.uid()
      and machines.is_system = false
  )
);

create policy "machine_template_update_custom"
on public.machine_setting_templates
for update
using (
  exists (
    select 1
    from public.machine_definitions machines
    where machines.id = machine_setting_templates.machine_id
      and machines.owner_user_id = auth.uid()
      and machines.is_system = false
  )
)
with check (
  exists (
    select 1
    from public.machine_definitions machines
    where machines.id = machine_setting_templates.machine_id
      and machines.owner_user_id = auth.uid()
      and machines.is_system = false
  )
);

create policy "machine_template_delete_custom"
on public.machine_setting_templates
for delete
using (
  exists (
    select 1
    from public.machine_definitions machines
    where machines.id = machine_setting_templates.machine_id
      and machines.owner_user_id = auth.uid()
      and machines.is_system = false
  )
);

create policy "workout_sessions_manage_own"
on public.workout_sessions
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "workout_session_body_parts_manage_own"
on public.workout_session_body_parts
for all
using (
  exists (
    select 1
    from public.workout_sessions sessions
    where sessions.id = workout_session_body_parts.session_id
      and sessions.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_sessions sessions
    where sessions.id = workout_session_body_parts.session_id
      and sessions.user_id = auth.uid()
  )
);

create policy "session_exercises_manage_own"
on public.session_exercises
for all
using (
  exists (
    select 1
    from public.workout_sessions sessions
    where sessions.id = session_exercises.session_id
      and sessions.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_sessions sessions
    where sessions.id = session_exercises.session_id
      and sessions.user_id = auth.uid()
  )
);

create policy "session_exercise_setting_values_manage_own"
on public.session_exercise_setting_values
for all
using (
  exists (
    select 1
    from public.session_exercises exercises
    join public.workout_sessions sessions on sessions.id = exercises.session_id
    where exercises.id = session_exercise_setting_values.session_exercise_id
      and sessions.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.session_exercises exercises
    join public.workout_sessions sessions on sessions.id = exercises.session_id
    where exercises.id = session_exercise_setting_values.session_exercise_id
      and sessions.user_id = auth.uid()
  )
);

create policy "session_exercise_sets_manage_own"
on public.session_exercise_sets
for all
using (
  exists (
    select 1
    from public.session_exercises exercises
    join public.workout_sessions sessions on sessions.id = exercises.session_id
    where exercises.id = session_exercise_sets.session_exercise_id
      and sessions.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.session_exercises exercises
    join public.workout_sessions sessions on sessions.id = exercises.session_id
    where exercises.id = session_exercise_sets.session_exercise_id
      and sessions.user_id = auth.uid()
  )
);
