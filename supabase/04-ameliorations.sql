-- Pépite : notifications, réactions, coup de cœur, signalements, messages
-- privés, Pépite de la semaine et connexion Google.
-- À coller une seule fois dans Supabase > SQL Editor, APRÈS 03-chansons.sql,
-- puis cliquer sur "Run".

-- 1. Coup de cœur sur un avis, et avis masqués après plusieurs signalements
alter table public.reviews
  add column heart boolean not null default false,
  add column hidden boolean not null default false;

-- 2. Réactions en emoji sur les avis
create table public.review_reactions (
  review_id bigint not null references public.reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null check (emoji in ('🔥', '😂', '😢', '💎')),
  created_at timestamptz not null default now(),
  primary key (review_id, user_id, emoji)
);

-- 3. Signalements : visibles dans Supabase > Table Editor > reports.
--    Au 3e signalement, l'avis est masqué automatiquement.
create table public.reports (
  id bigint generated always as identity primary key,
  review_id bigint not null references public.reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (reason in ('spam', 'mechant', 'hors-sujet', 'autre')),
  created_at timestamptz not null default now(),
  unique (review_id, user_id)
);

create function public.hide_reported_review()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select count(*) from public.reports where review_id = new.review_id) >= 3 then
    update public.reviews set hidden = true where id = new.review_id;
  end if;
  return new;
end;
$$;

create trigger on_report_created
  after insert on public.reports
  for each row execute function public.hide_reported_review();

-- 4. Messages privés (et albums recommandés), seulement entre amis :
--    on est amis quand l'un des deux est abonné à l'autre.
create function public.are_friends(a uuid, b uuid)
returns boolean
language sql stable
set search_path = ''
as $$
  select exists (
    select 1 from public.follows
    where (follower_id = a and following_id = b) or (follower_id = b and following_id = a)
  );
$$;

create table public.messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body text not null default '' check (char_length(body) <= 1000),
  album_id bigint,
  album_title text,
  artist_name text,
  cover_url text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id),
  check (char_length(body) > 0 or album_id is not null)
);
create index messages_sender_idx on public.messages (sender_id, created_at desc);
create index messages_recipient_idx on public.messages (recipient_id, created_at desc);

-- 5. Notifications (remplies automatiquement par la base)
create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('like', 'comment', 'follow', 'reaction', 'message', 'recommend')),
  review_id bigint references public.reviews (id) on delete cascade,
  emoji text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create function public.notify()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  target uuid;
  actor uuid;
  what text;
  review bigint;
  emo text;
begin
  if tg_table_name = 'follows' then
    target := new.following_id; actor := new.follower_id; what := 'follow';
  elsif tg_table_name = 'messages' then
    target := new.recipient_id; actor := new.sender_id;
    what := case when new.album_id is null then 'message' else 'recommend' end;
  else
    select user_id into target from public.reviews where id = new.review_id;
    actor := new.user_id; review := new.review_id;
    what := case tg_table_name when 'review_likes' then 'like' when 'review_comments' then 'comment' else 'reaction' end;
    if tg_table_name = 'review_reactions' then emo := new.emoji; end if;
  end if;
  if target is not null and target <> actor then
    insert into public.notifications (user_id, actor_id, kind, review_id, emoji)
    values (target, actor, what, review, emo);
  end if;
  return new;
end;
$$;

create trigger notify_like after insert on public.review_likes for each row execute function public.notify();
create trigger notify_comment after insert on public.review_comments for each row execute function public.notify();
create trigger notify_reaction after insert on public.review_reactions for each row execute function public.notify();
create trigger notify_follow after insert on public.follows for each row execute function public.notify();
create trigger notify_message after insert on public.messages for each row execute function public.notify();

-- 6. Pépite de la semaine : un vote par membre et par semaine
create table public.weekly_votes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  week date not null default date_trunc('week', now())::date,
  album_id bigint not null,
  album_title text not null,
  artist_name text not null,
  cover_url text,
  created_at timestamptz not null default now(),
  primary key (user_id, week)
);
create index weekly_votes_week_idx on public.weekly_votes (week);

-- 7. Sécurité
alter table public.review_reactions enable row level security;
alter table public.reports enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.weekly_votes enable row level security;

create policy "Réactions visibles par tous" on public.review_reactions for select using (true);
create policy "Chacun réagit" on public.review_reactions for insert with check ((select auth.uid()) = user_id);
create policy "Chacun retire sa réaction" on public.review_reactions for delete using ((select auth.uid()) = user_id);

create policy "Chacun voit ses signalements" on public.reports for select using ((select auth.uid()) = user_id);
create policy "Chacun signale" on public.reports for insert with check ((select auth.uid()) = user_id);

create policy "Messages visibles par les deux personnes" on public.messages for select
  using ((select auth.uid()) in (sender_id, recipient_id));
create policy "Messages seulement entre amis" on public.messages for insert
  with check ((select auth.uid()) = sender_id and public.are_friends(sender_id, recipient_id));
create policy "Le destinataire marque comme lu" on public.messages for update
  using ((select auth.uid()) = recipient_id);
-- On ne peut modifier que la date de lecture d'un message, pas son contenu.
revoke update on public.messages from anon, authenticated;
grant update (read_at) on public.messages to authenticated;

create policy "Chacun voit ses notifications" on public.notifications for select using ((select auth.uid()) = user_id);
create policy "Chacun marque ses notifications lues" on public.notifications for update using ((select auth.uid()) = user_id);
revoke update on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy "Votes visibles par tous" on public.weekly_votes for select using (true);
create policy "Chacun vote pour la semaine en cours" on public.weekly_votes for insert
  with check ((select auth.uid()) = user_id and week = date_trunc('week', now())::date);
create policy "Chacun change son vote de la semaine" on public.weekly_votes for update
  using ((select auth.uid()) = user_id and week = date_trunc('week', now())::date)
  with check ((select auth.uid()) = user_id and week = date_trunc('week', now())::date);
create policy "Chacun retire son vote" on public.weekly_votes for delete using ((select auth.uid()) = user_id);

-- 8. Connexion avec Google : le compte n'a pas de pseudo, on en fabrique un
--    à partir de l'e-mail (ex. "marie.dupont"), avec un numéro s'il est déjà pris.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  base text;
  candidate text;
begin
  candidate := meta ->> 'username';
  if candidate is null or candidate !~ '^[a-z0-9_.]{3,20}$' then
    base := left(regexp_replace(lower(split_part(coalesce(new.email, ''), '@', 1)), '[^a-z0-9_.]', '', 'g'), 14);
    if char_length(base) < 3 then base := 'membre'; end if;
    candidate := base;
    while exists (select 1 from public.profiles where username = candidate) loop
      candidate := base || floor(random() * 100000)::int;
    end loop;
  end if;
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    candidate,
    left(coalesce(nullif(meta ->> 'display_name', ''), nullif(meta ->> 'full_name', ''), nullif(meta ->> 'name', ''), candidate), 40),
    meta ->> 'avatar_url'
  );
  return new;
end;
$$;
