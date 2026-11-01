-- Pépite : réponses aux commentaires et « j'aime » sur les commentaires.
-- À coller une seule fois dans Supabase > SQL Editor > Run,
-- après les fichiers schema.sql, 02, 03 et 04.

-- 1. Un commentaire peut répondre à un autre commentaire
alter table public.review_comments
  add column parent_id bigint references public.review_comments (id) on delete cascade;
create index review_comments_parent_idx on public.review_comments (parent_id);

-- 2. Les « j'aime » sur les commentaires
create table public.comment_likes (
  comment_id bigint not null references public.review_comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.comment_likes enable row level security;
create policy "J'aime de commentaires visibles par tous" on public.comment_likes for select using (true);
create policy "Chacun aime un commentaire" on public.comment_likes for insert with check ((select auth.uid()) = user_id);
create policy "Chacun retire son j'aime de commentaire" on public.comment_likes for delete using ((select auth.uid()) = user_id);

-- 3. Notification « a répondu à ton commentaire »
alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('like', 'comment', 'follow', 'reaction', 'message', 'recommend', 'reply'));

create function public.notify_reply()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  target uuid;
begin
  if new.parent_id is null then
    return new;
  end if;
  select user_id into target from public.review_comments where id = new.parent_id;
  if target is not null and target <> new.user_id then
    insert into public.notifications (user_id, actor_id, kind, review_id)
    values (target, new.user_id, 'reply', new.review_id);
  end if;
  return new;
end;
$$;

create trigger notify_reply after insert on public.review_comments
  for each row execute function public.notify_reply();
