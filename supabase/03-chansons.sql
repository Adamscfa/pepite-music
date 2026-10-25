-- Pépite : noter aussi les chansons.
-- À coller une seule fois dans Supabase > SQL Editor, APRÈS 02-reseau-social.sql,
-- puis cliquer sur "Run".

-- Un avis vise un album (track_id vide) ou une chanson de cet album.
alter table public.reviews
  add column track_id bigint,
  add column track_title text;

-- Une seule note par membre pour un album, et une seule par chanson.
alter table public.reviews drop constraint reviews_user_id_album_id_key;
alter table public.reviews
  add constraint reviews_user_album_track_key unique nulls not distinct (user_id, album_id, track_id);

create index reviews_track_id_idx on public.reviews (track_id) where track_id is not null;
