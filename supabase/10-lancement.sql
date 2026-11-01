-- Pépite : prêt pour le lancement. Contact, suppression de compte, blocage,
-- limite anti-spam et annonces de la semaine.
-- À coller une seule fois dans Supabase > SQL Editor > Run, APRÈS 08-grande-mise-a-jour.sql.

-- 1. Messages envoyés depuis la page Contact (lus sur la page Modération)
create table public.contact_messages (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  name text not null default '' check (char_length(name) <= 80),
  email text not null default '' check (char_length(email) <= 200),
  topic text not null check (topic in ('question', 'bug', 'donnees', 'signalement', 'autre')),
  body text not null check (char_length(body) between 1 and 3000),
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
create policy "Tout le monde peut écrire" on public.contact_messages for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));
create policy "Les admins lisent les messages de contact" on public.contact_messages for select using (public.is_admin());
create policy "Les admins classent les messages de contact" on public.contact_messages for delete using (public.is_admin());

-- 2. Supprimer son compte (et tout ce qu'on a publié) depuis son profil
create or replace function public.delete_my_account()
returns void
language sql
security definer set search_path = ''
as $$
  delete from auth.users where id = (select auth.uid());
$$;
revoke execute on function public.delete_my_account() from anon, public;
grant execute on function public.delete_my_account() to authenticated;

-- 3. Bloquer un membre
create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;
create policy "Chacun voit qui il bloque" on public.blocks for select using ((select auth.uid()) = blocker_id);
create policy "Chacun bloque" on public.blocks for insert with check ((select auth.uid()) = blocker_id);
create policy "Chacun débloque" on public.blocks for delete using ((select auth.uid()) = blocker_id);

-- Vrai si l'un des deux a bloqué l'autre.
create or replace function public.is_blocked(a uuid, b uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

-- Plus de messages entre deux personnes quand l'une a bloqué l'autre.
drop policy "Messages seulement entre amis" on public.messages;
create policy "Messages seulement entre amis" on public.messages for insert
  with check (
    (select auth.uid()) = sender_id
    and public.are_friends(sender_id, recipient_id)
    and not public.is_blocked(sender_id, recipient_id)
  );

-- Bloquer quelqu'un arrête aussi les abonnements dans les deux sens.
create or replace function public.unfollow_on_block()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  delete from public.follows
  where (follower_id = new.blocker_id and following_id = new.blocked_id)
     or (follower_id = new.blocked_id and following_id = new.blocker_id);
  return new;
end;
$$;
create trigger unfollow_on_block after insert on public.blocks
  for each row execute function public.unfollow_on_block();

-- 4. Anti-spam : au plus 20 commentaires, 20 messages et 10 avis par minute et par membre
create or replace function public.limit_rate()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  author uuid;
  recent int;
  max_per_minute int;
begin
  if tg_table_name = 'messages' then
    author := new.sender_id;
    max_per_minute := 20;
    select count(*) into recent from public.messages
      where sender_id = author and created_at > now() - interval '1 minute';
  elsif tg_table_name = 'review_comments' then
    author := new.user_id;
    max_per_minute := 20;
    select count(*) into recent from public.review_comments
      where user_id = author and created_at > now() - interval '1 minute';
  else
    author := new.user_id;
    max_per_minute := 10;
    select count(*) into recent from public.reviews
      where user_id = author and created_at > now() - interval '1 minute';
  end if;
  if recent >= max_per_minute then
    raise exception 'trop_vite' using hint = 'Attends une minute avant de recommencer.';
  end if;
  return new;
end;
$$;
create trigger limit_messages before insert on public.messages
  for each row execute function public.limit_rate();
create trigger limit_comments before insert on public.review_comments
  for each row execute function public.limit_rate();
create trigger limit_reviews before insert on public.reviews
  for each row execute function public.limit_rate();

-- 5. Annonces de la semaine (Pépite de la semaine, rappel pour voter),
--    affichées dans les notifications du téléphone. Écrites par le site lui-même.
create table public.announcements (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) <= 120),
  body text not null check (char_length(body) <= 300),
  url text not null default '/' check (url like '/%'),
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
create policy "Annonces visibles par tous" on public.announcements for select using (true);
