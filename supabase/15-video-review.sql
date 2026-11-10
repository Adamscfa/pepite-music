-- Pépite : préparer la file vidéo à l'envoi manuel et à la validation admin.
-- À exécuter après 14-video-queue.sql.

grant insert on public.video_queue to authenticated;
revoke update on public.video_queue from authenticated;
grant update (status, approved_by, approved_at) on public.video_queue to authenticated;

drop policy if exists "Admins ajoutent des vidéos" on public.video_queue;
create policy "Admins ajoutent des vidéos" on public.video_queue
  for insert to authenticated
  with check (
    status = 'pending'
    and storage_path like 'admin/' || (select auth.uid())::text || '/%'
    and idempotency_key ~* '^[0-9a-f-]{36}$'
    and approved_by is null
    and approved_at is null
    and published_at is null
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin
    )
  );

drop policy if exists "Admins déposent les vidéos en attente" on storage.objects;
create policy "Admins déposent les vidéos en attente" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'weekly-videos'
    and (storage.foldername(name))[1] = 'admin'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin
    )
  );

drop policy if exists "Admins effacent les vidéos en attente" on storage.objects;
create policy "Admins effacent les vidéos en attente" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'weekly-videos'
    and (storage.foldername(name))[1] = 'admin'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin
    )
  );
