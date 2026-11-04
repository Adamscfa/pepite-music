-- Pépite : pseudos modifiables sans casser les anciens profils, invitations
-- ou mentions. À coller une seule fois dans Supabase > SQL Editor > Run,
-- APRÈS 11-invitations.sql.

create table public.profile_username_aliases (
  username text primary key check (username ~ '^[a-z0-9_.]{3,20}$'),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profile_username_aliases enable row level security;
create policy "Anciens pseudos visibles par tous" on public.profile_username_aliases
  for select using (true);
revoke all on public.profile_username_aliases from anon, authenticated;
grant select on public.profile_username_aliases to anon, authenticated;

create or replace function public.remember_previous_username()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.username is distinct from old.username then
    if exists (
      select 1 from public.profile_username_aliases
      where username = new.username and profile_id <> old.id
    ) then
      raise exception 'Ce pseudo est déjà associé à un autre compte.';
    end if;

    delete from public.profile_username_aliases
    where username = new.username and profile_id = old.id;

    insert into public.profile_username_aliases (username, profile_id)
    values (old.username, old.id)
    on conflict (username) do nothing;

    if not exists (
      select 1 from public.profile_username_aliases
      where username = old.username and profile_id = old.id
    ) then
      raise exception 'Ce pseudo est déjà associé à un autre compte.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists remember_previous_username on public.profiles;
create trigger remember_previous_username
  before update of username on public.profiles
  for each row execute function public.remember_previous_username();

create or replace function public.change_my_username(new_username text)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  current_username text;
begin
  if me is null or new_username !~ '^[a-z0-9_.]{3,20}$' then
    return false;
  end if;

  select username into current_username
  from public.profiles where id = me for update;
  if current_username is null then
    return false;
  end if;
  if current_username = new_username then
    return true;
  end if;
  if exists (
    select 1 from public.profiles
    where username = new_username and id <> me
  ) or exists (
    select 1 from public.profile_username_aliases
    where username = new_username and profile_id <> me
  ) then
    return false;
  end if;

  update public.profiles set username = new_username where id = me;
  return true;
end;
$$;
revoke execute on function public.change_my_username(text) from anon, public;
grant execute on function public.change_my_username(text) to authenticated;

-- Les anciens liens /profil/<pseudo> et @mentions restent reliés au même membre.
-- Les nouveaux liens utilisent toujours le pseudo actuel.
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
  select coalesce(
    (select p.id from public.profiles p where p.username = lower(inviter_username)),
    (select a.profile_id from public.profile_username_aliases a where a.username = lower(inviter_username))
  ) into inviter;
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
  delete from public.notifications
  where kind = 'follow' and created_at > now() - interval '1 minute'
    and ((user_id = inviter and actor_id = me) or (user_id = me and actor_id = inviter));
  insert into public.notifications (user_id, actor_id, kind) values (inviter, me, 'invite');
  return true;
end;
$$;
revoke execute on function public.accept_invite(text) from anon, public;
grant execute on function public.accept_invite(text) to authenticated;

-- Les mentions écrites avec un ancien pseudo continuent de prévenir le bon membre.
create or replace function public.notify_mentions()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.notifications (user_id, actor_id, kind, review_id)
  select distinct mentioned.profile_id, new.user_id, 'mention', new.review_id
  from regexp_matches(new.body, '@([A-Za-z0-9_.]{3,20})', 'g') as m(name)
  cross join lateral (
    select p.id as profile_id
    from public.profiles p
    where p.username = lower(m.name[1])
    union
    select a.profile_id
    from public.profile_username_aliases a
    where a.username = lower(m.name[1])
  ) as mentioned
  where mentioned.profile_id <> new.user_id
  limit 5;
  return new;
end;
$$;
