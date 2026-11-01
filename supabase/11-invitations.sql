-- Pépite : liens d'invitation personnels (« Ozz t'invite sur Pépite »).
-- À coller une seule fois dans Supabase > SQL Editor > Run, APRÈS 10-lancement.sql.

-- 1. Qui a invité qui (une seule fois par nouveau membre)
create table public.referrals (
  invited_id uuid primary key references public.profiles (id) on delete cascade,
  inviter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (invited_id <> inviter_id)
);
create index referrals_inviter_idx on public.referrals (inviter_id);

alter table public.referrals enable row level security;
-- Chacun voit les personnes qu'il a fait venir, et qui l'a invité.
create policy "Chacun voit ses invitations" on public.referrals for select
  using ((select auth.uid()) in (inviter_id, invited_id));

-- 2. Notification « X a rejoint Pépite grâce à toi »
alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('like', 'comment', 'follow', 'reaction', 'message', 'recommend', 'reply', 'mention', 'invite'));

-- 3. Accepter une invitation : appelé par le nouveau membre juste après son inscription.
--    On enregistre le parrain, on abonne les deux personnes l'une à l'autre,
--    et on prévient le parrain. Seulement pour un compte créé il y a moins de 7 jours.
create or replace function public.accept_invite(inviter_username text)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  inviter uuid;
begin
  if me is null then
    return false;
  end if;
  select id into inviter from public.profiles where username = lower(inviter_username);
  if inviter is null or inviter = me then
    return false;
  end if;
  if not exists (select 1 from public.profiles where id = me and created_at > now() - interval '7 days') then
    return false;
  end if;
  insert into public.referrals (invited_id, inviter_id) values (me, inviter)
  on conflict (invited_id) do nothing;
  if not found then
    return false;
  end if;
  insert into public.follows (follower_id, following_id) values (me, inviter), (inviter, me)
  on conflict do nothing;
  -- Les abonnements créent déjà des notifications « s'est abonné·e » : on garde la plus parlante.
  delete from public.notifications
  where kind = 'follow' and created_at > now() - interval '1 minute'
    and ((user_id = inviter and actor_id = me) or (user_id = me and actor_id = inviter));
  insert into public.notifications (user_id, actor_id, kind) values (inviter, me, 'invite');
  return true;
end;
$$;
revoke execute on function public.accept_invite(text) from anon, public;
grant execute on function public.accept_invite(text) to authenticated;
