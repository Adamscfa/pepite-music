-- Pépite : mise à jour « réseau social » (photos, favoris, abonnements, j'aime,
-- commentaires, listes). À coller une seule fois dans Supabase > SQL Editor,
-- APRÈS schema.sql, puis cliquer sur "Run".

-- 1. Photo de profil
alter table public.profiles add column avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Chacun dépose ses photos dans son propre dossier : avatars/<son id>/...
create policy "Chacun dépose sa photo" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Chacun remplace sa photo" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Chacun supprime sa photo" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 2. Les 4 albums favoris
create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  position smallint not null check (position between 1 and 4),
  album_id bigint not null,
  album_title text not null,
  artist_name text not null,
  cover_url text,
  primary key (user_id, position),
  unique (user_id, album_id)
);

-- 3. Les abonnements
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index follows_following_idx on public.follows (following_id);

-- 4. Les « j'aime » et les commentaires sur les avis
create table public.review_likes (
  review_id bigint not null references public.reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

create table public.review_comments (
  id bigint generated always as identity primary key,
  review_id bigint not null references public.reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index review_comments_review_idx on public.review_comments (review_id, created_at);

-- 5. Les listes d'albums
create table public.lists (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 300),
  created_at timestamptz not null default now()
);
create index lists_user_idx on public.lists (user_id);

create table public.list_items (
  list_id bigint not null references public.lists (id) on delete cascade,
  album_id bigint not null,
  album_title text not null,
  artist_name text not null,
  cover_url text,
  added_at timestamptz not null default now(),
  primary key (list_id, album_id)
);

-- 6. Sécurité : tout le monde lit, chacun ne modifie que ce qui est à lui
alter table public.favorites enable row level security;
alter table public.follows enable row level security;
alter table public.review_likes enable row level security;
alter table public.review_comments enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;

create policy "Favoris visibles par tous" on public.favorites for select using (true);
create policy "Chacun gère ses favoris" on public.favorites for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Abonnements visibles par tous" on public.follows for select using (true);
create policy "Chacun s'abonne" on public.follows for insert with check ((select auth.uid()) = follower_id);
create policy "Chacun se désabonne" on public.follows for delete using ((select auth.uid()) = follower_id);

create policy "J'aime visibles par tous" on public.review_likes for select using (true);
create policy "Chacun aime" on public.review_likes for insert with check ((select auth.uid()) = user_id);
create policy "Chacun retire son j'aime" on public.review_likes for delete using ((select auth.uid()) = user_id);

create policy "Commentaires visibles par tous" on public.review_comments for select using (true);
create policy "Chacun commente" on public.review_comments for insert with check ((select auth.uid()) = user_id);
create policy "Chacun supprime ses commentaires" on public.review_comments for delete using ((select auth.uid()) = user_id);

create policy "Listes visibles par tous" on public.lists for select using (true);
create policy "Chacun gère ses listes" on public.lists for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Contenu des listes visible par tous" on public.list_items for select using (true);
create policy "Chacun remplit ses listes" on public.list_items for all
  using (exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid())))
  with check (exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid())));
