-- Migration: 20260923100000_init
-- Aplique UMA vez no SQL Editor (projeto novo ou reset).
-- Não precisa rodar de novo quando houver migrations posteriores.

create table if not exists public.app_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.app_users enable row level security;

create or replace function public.register_app_user(
  p_username text,
  p_password text,
  p_display_name text
)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
  v_username text := lower(trim(p_username));
  v_display text := nullif(trim(p_display_name), '');
begin
  if v_username !~ '^[a-z0-9_]{3,20}$' then
    raise exception 'invalid_username' using errcode = 'P0001';
  end if;

  if char_length(p_password) < 6 then
    raise exception 'weak_password' using errcode = 'P0001';
  end if;

  insert into public.app_users (username, password_hash, display_name)
  values (
    v_username,
    crypt(p_password, gen_salt('bf'::text)),
    coalesce(v_display, v_username)
  )
  returning id into v_id;

  return json_build_object(
    'id', v_id,
    'username', v_username,
    'display_name', coalesce(v_display, v_username)
  );
exception
  when unique_violation then
    raise exception 'username_taken' using errcode = 'P0001';
end;
$$;

create or replace function public.login_app_user(
  p_username text,
  p_password text
)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r record;
begin
  select u.id, u.username, u.display_name
  into r
  from public.app_users u
  where u.username = lower(trim(p_username))
    and u.password_hash = crypt(p_password, u.password_hash);

  if not found then
    return null;
  end if;

  return json_build_object(
    'id', r.id,
    'username', r.username,
    'display_name', r.display_name
  );
end;
$$;

create or replace function public.list_app_profiles()
returns table (id uuid, username text, display_name text)
language sql
security definer
set search_path = public
as $$
  select u.id, u.username, u.display_name
  from public.app_users u
  order by u.display_name;
$$;

revoke all on function public.register_app_user(text, text, text) from public;
revoke all on function public.login_app_user(text, text) from public;
revoke all on function public.list_app_profiles() from public;

grant execute on function public.register_app_user(text, text, text) to anon, authenticated;
grant execute on function public.login_app_user(text, text) to anon, authenticated;
grant execute on function public.list_app_profiles() to anon, authenticated;

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  poster_path text,
  overview text not null default '',
  year text not null default '',
  genres text[] not null default '{}',
  suggested_by text not null,
  watched boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references public.app_users (id) on delete set null
);

create index if not exists items_created_at_idx on public.items (created_at desc);

alter table public.items add column if not exists created_by uuid;

do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.items'::regclass
      and c.contype = 'f'
      and pg_get_constraintdef(c.oid) ilike '%created_by%'
  loop
    execute format('alter table public.items drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.items
  drop constraint if exists items_created_by_fkey;

alter table public.items
  add constraint items_created_by_fkey
  foreign key (created_by) references public.app_users (id) on delete set null;

alter table public.items enable row level security;

drop policy if exists "items_select_all" on public.items;
drop policy if exists "items_insert_all" on public.items;
drop policy if exists "items_update_all" on public.items;
drop policy if exists "items_delete_all" on public.items;
drop policy if exists "items_select_authenticated" on public.items;
drop policy if exists "items_insert_authenticated" on public.items;
drop policy if exists "items_update_authenticated" on public.items;
drop policy if exists "items_delete_authenticated" on public.items;

create policy "items_select_all" on public.items for select using (true);
create policy "items_insert_all" on public.items for insert with check (true);
create policy "items_update_all" on public.items for update using (true) with check (true);
create policy "items_delete_all" on public.items for delete using (true);

do $$
begin
  alter publication supabase_realtime add table public.items;
exception
  when duplicate_object then null;
end $$;

insert into public.app_migrations (id)
values ('20260923100000_init')
on conflict (id) do nothing;
