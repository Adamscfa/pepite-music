-- Pépite : retirer les anciens objets Supabase de la file vidéo.
-- Avant d'exécuter : dans Supabase > Storage > weekly-videos, supprimer tous les fichiers.
-- Ce script s'arrête s'il reste des objets, pour éviter de laisser des MP4 orphelins.

begin;

do $$
begin
  if exists (
    select 1
    from storage.objects
    where bucket_id = 'weekly-videos'
  ) then
    raise exception 'Le bucket weekly-videos contient encore des fichiers. Supprime-les dans Supabase > Storage, puis relance ce script.';
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.video_queue') is not null then
    execute 'drop policy if exists "Admins ajoutent des vidéos" on public.video_queue';
    execute 'drop policy if exists "Admins consultent la file vidéo" on public.video_queue';
    execute 'drop policy if exists "Admins valident la file vidéo" on public.video_queue';
    execute 'drop trigger if exists set_video_queue_updated_at on public.video_queue';
  end if;
end;
$$;

drop policy if exists "Admins lisent les vidéos en attente" on storage.objects;
drop policy if exists "Admins déposent les vidéos en attente" on storage.objects;
drop policy if exists "Admins effacent les vidéos en attente" on storage.objects;

drop function if exists public.video_duel_candidates(date);
drop function if exists public.video_most_commented(date);
drop function if exists public.video_weekly_vote_top(date);
drop function if exists public.video_weekly_top(date);
drop function if exists public.set_video_queue_updated_at();
drop table if exists public.video_queue;

delete from storage.buckets
where id = 'weekly-videos';

commit;
