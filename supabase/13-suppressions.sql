-- Pépite : supprimer des messages et des notifications.
-- À coller une seule fois dans Supabase > SQL Editor > Run, APRÈS 12-pseudos-modifiables.sql.
--
-- Chacun peut effacer un message qu'il a envoyé (il disparaît pour les deux,
-- comme sur WhatsApp) et vider une conversation. Chacun peut effacer ses
-- notifications.

-- 1. Messages : on ne supprime que ceux qu'on a envoyés.
create policy "Chacun supprime ses messages envoyés" on public.messages for delete
  using ((select auth.uid()) = sender_id);

-- 2. Notifications : chacun supprime les siennes.
create policy "Chacun supprime ses notifications" on public.notifications for delete
  using ((select auth.uid()) = user_id);

-- 3. La page ouverte chez l'ami doit savoir qu'un message a disparu : le temps
--    réel de Supabase a besoin de connaître les colonnes de la ligne supprimée.
alter table public.messages replica identity full;

-- 4. Vider une conversation : les échanges des deux côtés partent d'un coup.
create function public.delete_thread(friend uuid)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null or friend is null or friend = me then
    return false;
  end if;
  delete from public.messages
  where (sender_id = me and recipient_id = friend)
     or (sender_id = friend and recipient_id = me);
  return true;
end;
$$;
revoke execute on function public.delete_thread(uuid) from anon, public;
grant execute on function public.delete_thread(uuid) to authenticated;
