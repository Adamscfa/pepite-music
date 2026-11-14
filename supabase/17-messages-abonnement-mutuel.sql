-- Pépite : les messages privés sont réservés aux membres qui se suivent mutuellement.
-- À coller dans Supabase > SQL Editor > Run, après 10-lancement.sql et 13-suppressions.sql.
-- Ce script peut être exécuté plusieurs fois sans créer de doublons.

-- Être amis signifie désormais que les deux abonnements existent.
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.follows as followed_by_a
    join public.follows as followed_by_b
      on followed_by_b.follower_id = b
     and followed_by_b.following_id = a
    where followed_by_a.follower_id = a
      and followed_by_a.following_id = b
  );
$$;

-- Les anciens messages ne sont visibles que tant que l'abonnement mutuel existe.
drop policy if exists "Messages visibles par les deux personnes" on public.messages;
create policy "Messages visibles par les deux personnes" on public.messages for select
  using (
    (select auth.uid()) in (sender_id, recipient_id)
    and public.are_friends(sender_id, recipient_id)
    and not public.is_blocked(sender_id, recipient_id)
  );

-- La base bloque aussi les envois directs qui contournent l'interface du site.
drop policy if exists "Messages seulement entre amis" on public.messages;
create policy "Messages seulement entre amis" on public.messages for insert
  with check (
    (select auth.uid()) = sender_id
    and public.are_friends(sender_id, recipient_id)
    and not public.is_blocked(sender_id, recipient_id)
  );
