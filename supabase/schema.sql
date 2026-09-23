-- Rode no SQL Editor do Supabase (Dashboard → SQL → New query)

-- Perfis (username + nome na lista)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Cria profile automaticamente no signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lista de filmes/séries
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  poster_path text,
  overview text not null default '',
  year text not null default '',
  suggested_by text not null,
  watched boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create index if not exists items_created_at_idx on public.items (created_at desc);

alter table public.items enable row level security;

drop policy if exists "items_select_all" on public.items;
drop policy if exists "items_insert_all" on public.items;
drop policy if exists "items_update_all" on public.items;
drop policy if exists "items_delete_all" on public.items;
drop policy if exists "items_select_authenticated" on public.items;
drop policy if exists "items_insert_authenticated" on public.items;
drop policy if exists "items_update_authenticated" on public.items;
drop policy if exists "items_delete_authenticated" on public.items;

create policy "items_select_authenticated"
  on public.items for select
  to authenticated
  using (true);

create policy "items_insert_authenticated"
  on public.items for insert
  to authenticated
  with check (true);

create policy "items_update_authenticated"
  on public.items for update
  to authenticated
  using (true)
  with check (true);

create policy "items_delete_authenticated"
  on public.items for delete
  to authenticated
  using (true);

-- Realtime entre aparelhos
do $$
begin
  alter publication supabase_realtime add table public.items;
exception
  when duplicate_object then null;
end $$;
