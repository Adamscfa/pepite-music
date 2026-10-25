-- Pépite : tables de la base de données.
-- À coller une seule fois dans Supabase > SQL Editor, puis cliquer sur "Run".

-- 1. Les profils des membres (un par compte)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_.]{3,20}$'),
  display_name text not null check (char_length(display_name) between 1 and 40),
  bio text not null default '' check (char_length(bio) <= 200),
  created_at timestamptz not null default now()
);

-- 2. Les notes et avis. On garde une copie du titre et de la pochette
--    pour afficher le fil sans rappeler Deezer.
create table public.reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  album_id bigint not null,
  album_title text not null,
  artist_name text not null,
  cover_url text,
  release_year int,
  rating smallint not null check (rating between 1 and 5),
  body text not null default '' check (char_length(body) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, album_id) -- une seule note par membre et par album
);

create index reviews_updated_at_idx on public.reviews (updated_at desc);
create index reviews_album_id_idx on public.reviews (album_id);

-- 3. Sécurité : tout le monde peut lire, chacun ne modifie que ses propres données
alter table public.profiles enable row level security;
alter table public.reviews enable row level security;

create policy "Profils visibles par tous" on public.profiles
  for select using (true);
create policy "Chacun modifie son profil" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Avis visibles par tous" on public.reviews
  for select using (true);
create policy "Chacun publie ses avis" on public.reviews
  for insert with check ((select auth.uid()) = user_id);
create policy "Chacun modifie ses avis" on public.reviews
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Chacun supprime ses avis" on public.reviews
  for delete using ((select auth.uid()) = user_id);

-- 4. Crée le profil automatiquement à l'inscription
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'username')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
