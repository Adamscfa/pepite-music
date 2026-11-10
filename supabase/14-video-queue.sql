-- Pépite : base du flux de vidéos éditoriales, avec validation humaine obligatoire.
-- À exécuter dans Supabase > SQL Editor, après 13-suppressions.sql.
-- Les requêtes d'idées et de duels sont réservées au worker de confiance (service_role).

alter table public.profiles
  add column if not exists is_demo boolean not null default false,
  add column if not exists is_admin boolean not null default false;

create table if not exists public.video_queue (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  week_start date not null,
  format text not null check (format in ('top', 'duel', 'avis')),
  status text not null default 'rendering'
    check (status in ('rendering', 'pending', 'approved', 'rejected', 'published', 'failed')),
  source_data jsonb not null default '{}'::jsonb,
  editorial jsonb not null default '{}'::jsonb,
  storage_path text,
  error_message text,
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists video_queue_status_created_idx
  on public.video_queue (status, created_at desc);
create index if not exists video_queue_week_idx
  on public.video_queue (week_start desc);

alter table public.video_queue enable row level security;
revoke all on public.video_queue from anon, authenticated;
grant select, update on public.video_queue to authenticated;
grant all on public.video_queue to service_role;

drop policy if exists "Admins consultent la file vidéo" on public.video_queue;
create policy "Admins consultent la file vidéo" on public.video_queue
  for select to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin
  ));

drop policy if exists "Admins valident la file vidéo" on public.video_queue;
create policy "Admins valident la file vidéo" on public.video_queue
  for update to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin
  ));

create or replace function public.set_video_queue_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_video_queue_updated_at on public.video_queue;
create trigger set_video_queue_updated_at
  before update on public.video_queue
  for each row execute function public.set_video_queue_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('weekly-videos', 'weekly-videos', false, 209715200, array['video/mp4'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins lisent les vidéos en attente" on storage.objects;
create policy "Admins lisent les vidéos en attente" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'weekly-videos'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin
    )
  );

-- Données factuelles de la semaine : uniquement les avis d'albums publics
-- et visibles, écrits par de vrais membres (jamais les profils Démo).
create or replace function public.video_weekly_top(
  p_week_start date default date_trunc('week', now())::date
)
returns table (
  album_id bigint,
  album_title text,
  artist_name text,
  cover_url text,
  review_count bigint,
  average_rating numeric
)
language sql
stable
set search_path = ''
as $$
  select
    r.album_id,
    max(r.album_title),
    max(r.artist_name),
    max(r.cover_url),
    count(*)::bigint,
    round(avg(r.rating)::numeric, 2)
  from public.reviews r
  join public.profiles author on author.id = r.user_id
  where r.track_id is null
    and not r.hidden
    and not author.is_demo
    and r.created_at >= p_week_start
    and r.created_at < p_week_start + 7
  group by r.album_id
  order by count(*) desc, avg(r.rating) desc, r.album_id
  limit 20;
$$;

-- Votes réels pour « Pépite de la semaine », distincts des avis publiés cette semaine.
create or replace function public.video_weekly_vote_top(
  p_week_start date default date_trunc('week', now())::date
)
returns table (
  album_id bigint,
  album_title text,
  artist_name text,
  cover_url text,
  vote_count bigint
)
language sql
stable
set search_path = ''
as $$
  select
    v.album_id,
    max(v.album_title),
    max(v.artist_name),
    max(v.cover_url),
    count(*)::bigint
  from public.weekly_votes v
  join public.profiles voter on voter.id = v.user_id
  where v.week = p_week_start
    and not voter.is_demo
  group by v.album_id
  order by count(*) desc, v.album_id
  limit 20;
$$;

create or replace function public.video_most_commented(
  p_week_start date default date_trunc('week', now())::date
)
returns table (
  album_id bigint,
  album_title text,
  artist_name text,
  cover_url text,
  comment_count bigint,
  review_count bigint
)
language sql
stable
set search_path = ''
as $$
  select
    r.album_id,
    max(r.album_title),
    max(r.artist_name),
    max(r.cover_url),
    count(c.id)::bigint,
    count(distinct r.id)::bigint
  from public.review_comments c
  join public.profiles commenter on commenter.id = c.user_id
  join public.reviews r on r.id = c.review_id
  join public.profiles author on author.id = r.user_id
  where r.track_id is null
    and not r.hidden
    and not commenter.is_demo
    and not author.is_demo
    and c.created_at >= p_week_start
    and c.created_at < p_week_start + 7
  group by r.album_id
  order by count(c.id) desc, count(distinct r.id) desc, r.album_id
  limit 20;
$$;

-- Paires suggérées, pas des affirmations éditoriales : le cerveau peut choisir
-- parmi les albums actifs cette semaine, et doit citer les chiffres fournis.
create or replace function public.video_duel_candidates(
  p_week_start date default date_trunc('week', now())::date
)
returns table (
  left_album_id bigint,
  left_album_title text,
  left_artist_name text,
  left_cover_url text,
  left_review_count bigint,
  left_average_rating numeric,
  right_album_id bigint,
  right_album_title text,
  right_artist_name text,
  right_cover_url text,
  right_review_count bigint,
  right_average_rating numeric
)
language sql
stable
set search_path = ''
as $$
  select
    a.album_id, a.album_title, a.artist_name, a.cover_url, a.review_count, a.average_rating,
    b.album_id, b.album_title, b.artist_name, b.cover_url, b.review_count, b.average_rating
  from public.video_weekly_top(p_week_start) a
  join public.video_weekly_top(p_week_start) b on a.album_id < b.album_id
  order by
    a.review_count + b.review_count desc,
    abs(a.average_rating - b.average_rating),
    a.album_id,
    b.album_id
  limit 20;
$$;

revoke all on function public.video_weekly_top(date) from public, anon, authenticated;
revoke all on function public.video_weekly_vote_top(date) from public, anon, authenticated;
revoke all on function public.video_most_commented(date) from public, anon, authenticated;
revoke all on function public.video_duel_candidates(date) from public, anon, authenticated;
grant execute on function public.video_weekly_top(date) to service_role;
grant execute on function public.video_weekly_vote_top(date) to service_role;
grant execute on function public.video_most_commented(date) to service_role;
grant execute on function public.video_duel_candidates(date) to service_role;
