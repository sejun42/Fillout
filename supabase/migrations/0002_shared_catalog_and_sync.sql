alter table public.brand_definitions
  add column if not exists is_shared boolean not null default false;

alter table public.machine_definitions
  add column if not exists is_shared boolean not null default false;

update public.brand_definitions
set is_shared = true
where is_system = true
  and is_shared = false;

update public.machine_definitions
set is_shared = true
where is_system = true
  and is_shared = false;

drop policy if exists "brand_read_visible" on public.brand_definitions;
create policy "brand_read_visible"
on public.brand_definitions
for select
using (is_system = true or is_shared = true or owner_user_id = auth.uid());

drop policy if exists "machine_read_visible" on public.machine_definitions;
create policy "machine_read_visible"
on public.machine_definitions
for select
using (is_system = true or is_shared = true or owner_user_id = auth.uid());

drop policy if exists "machine_template_read_visible" on public.machine_setting_templates;
create policy "machine_template_read_visible"
on public.machine_setting_templates
for select
using (
  exists (
    select 1
    from public.machine_definitions machines
    where machines.id = machine_setting_templates.machine_id
      and (
        machines.is_system = true
        or machines.is_shared = true
        or machines.owner_user_id = auth.uid()
      )
  )
);
