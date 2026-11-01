-- Pépite : accueil des nouveaux membres, notifications sur le téléphone,
-- mentions @pseudo, modération et suivi des erreurs.
-- À coller une seule fois dans Supabase > SQL Editor > Run, APRÈS 07-temps-reel.sql.

-- 1. Profils : genres préférés, premier pas terminé, administrateur
alter table public.profiles
  add column if not exists favorite_genres int[] not null default '{}',
  add column if not exists onboarded boolean not null default false,
  add column if not exists is_admin boolean not null default false;

-- Les membres déjà inscrits n'ont pas besoin de refaire le premier pas.
update public.profiles set onboarded = true;

-- Chacun ne peut modifier que ces colonnes de son profil
-- (pas « administrateur », ni « démo », ni son pseudo).
revoke update on public.profiles from anon, authenticated;
grant update (display_name, bio, avatar_url, favorite_genres, onboarded) on public.profiles to authenticated;

-- Vrai si le membre connecté est administrateur.
create or replace function public.is_admin()
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select coalesce((select is_admin from public.profiles where id = (select auth.uid())), false);
$$;

-- 2. Notifications sur le téléphone (une ligne par appareil abonné)
create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
create policy "Chacun voit ses appareils" on public.push_subscriptions for select using ((select auth.uid()) = user_id);
create policy "Chacun abonne ses appareils" on public.push_subscriptions for insert with check ((select auth.uid()) = user_id);
create policy "Chacun met à jour ses appareils" on public.push_subscriptions for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Chacun désabonne ses appareils" on public.push_subscriptions for delete using ((select auth.uid()) = user_id);

-- Les appareils d'un membre, donnés seulement à quelqu'un qui vient de lui envoyer
-- un message ou de déclencher une notification (dans les 2 dernières minutes).
create or replace function public.push_targets(target uuid)
returns table (endpoint text)
language sql stable
security definer set search_path = ''
as $$
  select s.endpoint from public.push_subscriptions s
  where s.user_id = target
    and (
      exists (select 1 from public.notifications n
              where n.user_id = target and n.actor_id = (select auth.uid())
                and n.created_at > now() - interval '2 minutes')
      or exists (select 1 from public.messages m
                 where m.recipient_id = target and m.sender_id = (select auth.uid())
                   and m.created_at > now() - interval '2 minutes')
    );
$$;

-- Oublie un appareil qui n'existe plus (le service de notifications répond « inconnu »).
create or replace function public.forget_push(old_endpoint text)
returns void
language sql
security definer set search_path = ''
as $$
  delete from public.push_subscriptions where endpoint = old_endpoint;
$$;

-- 3. Mentions @pseudo dans les commentaires
alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('like', 'comment', 'follow', 'reaction', 'message', 'recommend', 'reply', 'mention'));

create or replace function public.notify_mentions()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.notifications (user_id, actor_id, kind, review_id)
  select distinct p.id, new.user_id, 'mention', new.review_id
  from regexp_matches(new.body, '@([A-Za-z0-9_.]{3,20})', 'g') as m(name)
  join public.profiles p on p.username = lower(m.name[1])
  where p.id <> new.user_id
  limit 5;
  return new;
end;
$$;

create trigger notify_mentions after insert on public.review_comments
  for each row execute function public.notify_mentions();

-- 4. Modération : les administrateurs voient les signalements et gèrent les avis
create policy "Les admins voient tous les signalements" on public.reports for select using (public.is_admin());
create policy "Les admins classent les signalements" on public.reports for delete using (public.is_admin());
create policy "Les admins modèrent les avis" on public.reviews for update
  using (public.is_admin()) with check (public.is_admin());
create policy "Les admins suppriment les avis" on public.reviews for delete using (public.is_admin());

-- 5. Suivi des erreurs : le site note ici les pages qui ont planté
create table public.errors (
  id bigint generated always as identity primary key,
  message text not null check (char_length(message) <= 1000),
  digest text check (char_length(digest) <= 100),
  path text check (char_length(path) <= 300),
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.errors enable row level security;
create policy "Tout le monde peut signaler une erreur" on public.errors for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));
create policy "Les admins lisent les erreurs" on public.errors for select using (public.is_admin());
create policy "Les admins effacent les erreurs" on public.errors for delete using (public.is_admin());
