-- Pépite : membres de démonstration, pour que le site ne soit pas vide au lancement.
-- À coller une seule fois dans Supabase > SQL Editor > Run, APRÈS les fichiers 01 à 05.
--
-- Ce fichier crée 8 membres imaginaires, marqués « Démo » sur le site, avec des avis
-- sur de vrais albums et titres (cherchés chez Deezer au moment de l'exécution),
-- des commentaires, des réponses, des « j'aime », des réactions, des abonnements
-- et des votes pour la Pépite de la semaine.
-- Ces comptes n'ont pas de mot de passe : personne ne peut s'y connecter.
--
-- Pour tout effacer plus tard : exécuter demo-supprimer.sql.
-- L'exécution prend environ une minute (le temps d'interroger Deezer).

-- 1. Marque « Démo » sur les profils
alter table public.profiles add column if not exists is_demo boolean not null default false;

-- 2. Outil pour interroger Deezer depuis la base
create extension if not exists http with schema extensions;

create or replace function pg_temp.deezer(path text) returns jsonb
language plpgsql as $$
declare
  res record;
begin
  select status, content into res from extensions.http_get('https://api.deezer.com' || path);
  if res.status <> 200 then
    return null;
  end if;
  return res.content::jsonb;
exception when others then
  return null;
end;
$$;

create or replace function pg_temp.year_of(album_id text) returns int
language plpgsql as $$
declare
  y int;
begin
  y := nullif(left(coalesce(pg_temp.deezer('/album/' || album_id) ->> 'release_date', ''), 4), '')::int;
  return nullif(y, 0);
exception when others then
  return null;
end;
$$;

-- Un album : on cherche d'abord précisément (artiste + titre), puis plus largement.
create or replace function pg_temp.find_album(artist text, title text) returns jsonb
language plpgsql as $$
declare
  hit jsonb;
begin
  hit := pg_temp.deezer('/search/album?limit=1&q='
    || extensions.urlencode('artist:"' || artist || '" album:"' || title || '"')) -> 'data' -> 0;
  if hit is null then
    hit := pg_temp.deezer('/search/album?limit=1&q=' || extensions.urlencode(artist || ' ' || title)) -> 'data' -> 0;
  end if;
  if hit is null then
    return null;
  end if;
  return jsonb_build_object(
    'album_id', (hit ->> 'id')::bigint,
    'album_title', hit ->> 'title',
    'artist_name', hit -> 'artist' ->> 'name',
    'cover_url', hit ->> 'cover_medium',
    'release_year', pg_temp.year_of(hit ->> 'id'),
    'track_id', null,
    'track_title', null
  );
end;
$$;

-- Un titre, avec l'album dont il vient.
create or replace function pg_temp.find_track(artist text, title text) returns jsonb
language plpgsql as $$
declare
  hit jsonb;
begin
  hit := pg_temp.deezer('/search/track?limit=1&q='
    || extensions.urlencode('artist:"' || artist || '" track:"' || title || '"')) -> 'data' -> 0;
  if hit is null then
    hit := pg_temp.deezer('/search/track?limit=1&q=' || extensions.urlencode(artist || ' ' || title)) -> 'data' -> 0;
  end if;
  if hit is null then
    return null;
  end if;
  return jsonb_build_object(
    'album_id', (hit -> 'album' ->> 'id')::bigint,
    'album_title', hit -> 'album' ->> 'title',
    'artist_name', hit -> 'artist' ->> 'name',
    'cover_url', hit -> 'album' ->> 'cover_medium',
    'release_year', pg_temp.year_of(hit -> 'album' ->> 'id'),
    'track_id', (hit ->> 'id')::bigint,
    'track_title', hit ->> 'title'
  );
end;
$$;

-- 3. Les membres
drop table if exists demo_users;
create temp table demo_users (id uuid, username text, display_name text, bio text, joined_days int);
insert into demo_users values
  ('de300000-0000-4000-8000-000000000001', 'awa.kone', 'Awa Koné', 'Afrobeats, R&B et grosses voix. Toujours un casque sur les oreilles.', 40),
  ('de300000-0000-4000-8000-000000000002', 'yann.brou', 'Yann Brou', 'Rap français et ivoirien. Je note sévère, mais juste.', 38),
  ('de300000-0000-4000-8000-000000000003', 'marie.sound', 'Marie-Laure', 'Pop, soul, et tout ce qui fait danser.', 33),
  ('de300000-0000-4000-8000-000000000004', 'koffi225', 'Koffi A.', 'Coupé-décalé dans le sang, curieux de tout le reste.', 30),
  ('de300000-0000-4000-8000-000000000005', 'ines.vinyles', 'Inès', 'Collectionneuse de vinyles. Jazz, soul et grands classiques.', 27),
  ('de300000-0000-4000-8000-000000000006', 'moussa.beats', 'Moussa D.', 'Beatmaker amateur. J''écoute les prods avant les paroles.', 22),
  ('de300000-0000-4000-8000-000000000007', 'lea.playlist', 'Léa', 'Toujours une playlist en route, rarement la même.', 18),
  ('de300000-0000-4000-8000-000000000008', 'david.k', 'David K.', 'Électro, rock et un peu de tout. Fan de Daft Punk depuis toujours.', 12);

-- 4. Les avis : membre, artiste, album ou titre, note, coup de cœur, texte, il y a combien d'heures
drop table if exists demo_reviews;
create temp table demo_reviews (
  key text, username text, artist text, title text, is_track boolean,
  rating int, heart boolean, body text, hours_ago numeric
);
insert into demo_reviews values
  ('starboy-awa', 'awa.kone', 'The Weeknd', 'Starboy', false, 5, true,
   'Un album incroyable du début à la fin. Les collaborations avec Daft Punk sont parfaites, et la production est d''une propreté folle.', 3),
  ('starboy-david', 'david.k', 'The Weeknd', 'Starboy', false, 4, false,
   'I Feel It Coming tourne en boucle chez moi. Un peu long par moments, mais les meilleurs titres sont au sommet.', 29),
  ('starboy-lea', 'lea.playlist', 'The Weeknd', 'Starboy', false, 4, false,
   'Parfait pour rouler de nuit. Party Monster est sous-cotée.', 75),
  ('damini-awa', 'awa.kone', 'Burna Boy', 'Love, Damini', false, 5, true,
   'Burna au sommet. On passe de l''afrobeats au gospel sans jamais perdre le fil. Last Last est déjà un classique.', 7),
  ('damini-koffi', 'koffi225', 'Burna Boy', 'Love, Damini', false, 4, false,
   'Très beau projet, plus calme que African Giant. Il faut plusieurs écoutes pour tout apprécier.', 52),
  ('damini-moussa', 'moussa.beats', 'Burna Boy', 'Love, Damini', false, 5, false,
   'Les percussions sur cet album, c''est une masterclass. Chaque prod respire.', 96),
  ('lagos-marie', 'marie.sound', 'Wizkid', 'Made In Lagos', false, 5, true,
   'Doux, solaire, élégant. Essence avec Tems, je ne m''en lasse pas.', 12),
  ('lagos-koffi', 'koffi225', 'Wizkid', 'Made In Lagos', false, 4, false,
   'Un album à mettre le dimanche matin. Pas de temps mort.', 140),
  ('tems-marie', 'marie.sound', 'Tems', 'Born in the Wild', false, 4, false,
   'Sa voix est unique. Un premier album très personnel, qui prend son temps.', 20),
  ('rema-lea', 'lea.playlist', 'Rema', 'Rave & Roses', false, 4, false,
   'Calm Down a tout écrasé, mais le reste de l''album mérite aussi qu''on s''y arrête.', 44),
  ('nakamura-awa', 'awa.kone', 'Aya Nakamura', 'Nakamura', false, 4, false,
   'Des refrains qu''on chante après une seule écoute. Djadja et Pookie, impossible de rester assise.', 60),
  ('nakamura-yann', 'yann.brou', 'Aya Nakamura', 'Nakamura', false, 3, false,
   'Les singles sont énormes, le reste est plus inégal. Mais quelle énergie.', 110),
  ('destin-yann', 'yann.brou', 'Ninho', 'Destin', false, 4, false,
   'Ninho dans sa meilleure forme : des tubes à la chaîne et une vraie cohérence.', 16),
  ('pnl-yann', 'yann.brou', 'PNL', 'Deux frères', false, 5, true,
   'Un monument. Au DD, Blanka, Deux frères... L''ambiance de cet album ne ressemble à rien d''autre.', 34),
  ('ipseite-moussa', 'moussa.beats', 'Damso', 'Ipséité', false, 5, false,
   'Les prods sont sombres et travaillées, l''écriture est chirurgicale. À réécouter au casque.', 68),
  ('melo-lea', 'lea.playlist', 'Tiakola', 'Mélo', false, 4, false,
   'Des mélodies partout, une voix qui fait le travail. Très bon premier album.', 90),
  ('sos-marie', 'marie.sound', 'SZA', 'SOS', false, 5, false,
   'Kill Bill, Snooze, Good Days... SZA écrit comme personne. Long mais jamais ennuyeux.', 9),
  ('sos-awa', 'awa.kone', 'SZA', 'SOS', false, 4, false,
   'Il y a deux ou trois titres en trop, mais les meilleurs sont parfaits.', 120),
  ('renaissance-david', 'david.k', 'Beyoncé', 'Renaissance', false, 5, true,
   'Un vrai album de club, enchaîné comme un DJ set. Les transitions sont géniales.', 26),
  ('tpab-ines', 'ines.vinyles', 'Kendrick Lamar', 'To Pimp a Butterfly', false, 5, true,
   'Jazz, funk, poésie et colère. Un album qu''on étudiera encore dans vingt ans.', 5),
  ('blonde-ines', 'ines.vinyles', 'Frank Ocean', 'Blonde', false, 5, false,
   'Intime et lumineux. Nikes, Ivy, Self Control : tout est à sa place.', 48),
  ('ram-david', 'david.k', 'Daft Punk', 'Random Access Memories', false, 5, false,
   'Le son est magnifique, les invités aussi. Giorgio by Moroder reste mon moment préféré.', 80),
  ('multitude-marie', 'marie.sound', 'Stromae', 'Multitude', false, 4, false,
   'Des textes toujours aussi forts, des sons venus du monde entier. Santé est une petite merveille.', 160),
  ('btb-ines', 'ines.vinyles', 'Amy Winehouse', 'Back to Black', false, 5, false,
   'Une voix immense sur une production soul parfaite. Indémodable.', 100),
  ('kob-ines', 'ines.vinyles', 'Miles Davis', 'Kind of Blue', false, 5, true,
   'Le disque que je conseille à tous ceux qui veulent commencer le jazz.', 180),
  ('t-lastlast-koffi', 'koffi225', 'Burna Boy', 'Last Last', true, 5, false,
   'On l''a dansé partout cette année-là. Le sample de Toni Braxton est trop bien utilisé.', 22),
  ('t-gaou-koffi', 'koffi225', 'Magic System', 'Premier gaou', true, 5, true,
   'Un classique ivoirien. Il passe encore à chaque fête et tout le monde chante.', 64),
  ('t-djadja-lea', 'lea.playlist', 'Aya Nakamura', 'Djadja', true, 4, false,
   'Le refrain le plus efficace de ces dernières années.', 130),
  ('t-blinding-david', 'david.k', 'The Weeknd', 'Blinding Lights', true, 4, false,
   'Le synthé des années 80 version 2020. Impossible de ne pas monter le son.', 150),
  ('t-freemind-awa', 'awa.kone', 'Tems', 'Free Mind', true, 5, false,
   'Une chanson qui apaise. Sa voix grave fait tout.', 85),
  ('t-jefe-yann', 'yann.brou', 'Ninho', 'Jefe', true, 4, false,
   'Simple et redoutable. Le genre de son qui ne vieillit pas.', 170);

-- 5. Les commentaires et les réponses : clé, avis, réponse à, membre, texte, heures après l'avis
drop table if exists demo_comments;
create temp table demo_comments (
  key text, review_key text, parent_key text, username text, body text, hours_after numeric
);
insert into demo_comments values
  ('c1', 'starboy-awa', null, 'marie.sound', 'Tout simplement génial ! Starboy avec Daft Punk, quelle intro.', 0.5),
  ('c2', 'starboy-awa', 'c1', 'awa.kone', 'Et la fin avec I Feel It Coming, encore eux !', 0.8),
  ('c3', 'starboy-awa', 'c2', 'david.k', 'Les deux meilleurs titres de l''album pour moi.', 1.2),
  ('c4', 'starboy-awa', null, 'yann.brou', 'Mon album préféré de The Weeknd, juste devant After Hours.', 1.5),
  ('c5', 'damini-awa', null, 'koffi225', 'D''accord sur Last Last. Mais Alone mérite aussi qu''on en parle.', 1),
  ('c6', 'damini-awa', 'c5', 'moussa.beats', 'Alone est sous-coté, la prod est énorme.', 2),
  ('c7', 'pnl-yann', null, 'moussa.beats', 'Les prods de cet album... rien à jeter.', 3),
  ('c8', 'pnl-yann', 'c7', 'yann.brou', 'Au DD reste un des clips les plus fous du rap français.', 4),
  ('c9', 'tpab-ines', null, 'yann.brou', 'Alright, The Blacker the Berry, How Much a Dollar Cost... intouchable.', 1),
  ('c10', 'tpab-ines', null, 'david.k', 'Je l''ai découvert grâce à toi, merci !', 2),
  ('c11', 'tpab-ines', 'c10', 'ines.vinyles', 'Avec plaisir ! Écoute Good Kid, M.A.A.D City juste après.', 2.5),
  ('c12', 'lagos-marie', null, 'awa.kone', 'Essence en boucle pendant des mois, pareil !', 1),
  ('c13', 'sos-marie', null, 'lea.playlist', 'Snooze, ma chanson de l''année.', 2),
  ('c14', 'sos-marie', 'c13', 'marie.sound', 'Elle est tellement douce, ce refrain.', 3),
  ('c15', 't-gaou-koffi', null, 'awa.kone', 'On ne s''en lasse jamais. C''est l''hymne des soirées !', 1),
  ('c16', 't-gaou-koffi', 'c15', 'koffi225', 'Exactement, ça met tout le monde d''accord.', 2),
  ('c17', 'renaissance-david', null, 'marie.sound', 'Break My Soul en ouverture de soirée, ça marche à tous les coups.', 3),
  ('c18', 'ram-david', null, 'ines.vinyles', 'Le pressage vinyle est superbe, d''ailleurs.', 5),
  ('c19', 'destin-yann', null, 'lea.playlist', 'Lettre à une femme, je l''écoute encore.', 2),
  ('c20', 'ipseite-moussa', null, 'yann.brou', 'Macarena, le titre qui a fait découvrir Damso à tout le monde.', 4);

-- 6. On remplit la base
do $$
declare
  u record;
  r record;
  c record;
  info jsonb;
  rid bigint;
  cid bigint;
  parent bigint;
  base timestamptz;
  emojis text[] := array['🔥', '💎', '😂', '😢'];
begin
  if exists (select 1 from public.profiles where is_demo) then
    raise exception 'Les membres de démo existent déjà. Pour recommencer, exécute d''abord demo-supprimer.sql.';
  end if;

  -- Comptes sans mot de passe : le profil est créé automatiquement par la base.
  for u in select * from demo_users loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
      u.username || '@demo.pepite.invalid', '', now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('username', u.username, 'display_name', u.display_name),
      now() - make_interval(days => u.joined_days), now(),
      '', '', '', ''
    );
    update public.profiles
      set is_demo = true, bio = u.bio, created_at = now() - make_interval(days => u.joined_days)
      where id = u.id;
  end loop;

  -- Les avis, avec les vraies infos Deezer.
  create temp table demo_review_ids (key text primary key, id bigint, created timestamptz);
  for r in select * from demo_reviews loop
    info := case when r.is_track then pg_temp.find_track(r.artist, r.title) else pg_temp.find_album(r.artist, r.title) end;
    if info is null then
      raise notice 'Introuvable chez Deezer, avis ignoré : % – %', r.artist, r.title;
      continue;
    end if;
    base := now() - make_interval(mins => (r.hours_ago * 60)::int);
    rid := null;
    insert into public.reviews (
      user_id, album_id, album_title, artist_name, cover_url, release_year,
      track_id, track_title, rating, heart, body, created_at, updated_at
    ) values (
      (select id from public.profiles where username = r.username),
      (info ->> 'album_id')::bigint, info ->> 'album_title', info ->> 'artist_name', info ->> 'cover_url',
      (info ->> 'release_year')::int, (info ->> 'track_id')::bigint, info ->> 'track_title',
      r.rating, r.heart, r.body, base, base
    )
    on conflict do nothing
    returning id into rid;
    if rid is not null then
      insert into demo_review_ids values (r.key, rid, base);
    end if;
  end loop;

  -- Commentaires et réponses, dans l'ordre.
  create temp table demo_comment_ids (key text primary key, id bigint);
  for c in select * from demo_comments order by review_key, hours_after loop
    select id, created into rid, base from demo_review_ids where key = c.review_key;
    if rid is null then
      continue;
    end if;
    parent := (select id from demo_comment_ids where key = c.parent_key);
    if c.parent_key is not null and parent is null then
      continue;
    end if;
    insert into public.review_comments (review_id, user_id, body, parent_id, created_at)
    values (
      rid, (select id from public.profiles where username = c.username), c.body, parent,
      least(now(), base + make_interval(mins => (c.hours_after * 60)::int))
    )
    returning id into cid;
    insert into demo_comment_ids values (c.key, cid);
  end loop;

  -- « J'aime » et réactions entre membres de démo (un peu au hasard).
  insert into public.review_likes (review_id, user_id)
  select r.id, u.id from public.reviews r
  join public.profiles a on a.id = r.user_id and a.is_demo
  cross join public.profiles u
  where u.is_demo and u.id <> r.user_id and random() < 0.5
  on conflict do nothing;

  insert into public.review_reactions (review_id, user_id, emoji)
  select r.id, u.id, emojis[1 + floor(random() * 4)::int] from public.reviews r
  join public.profiles a on a.id = r.user_id and a.is_demo
  cross join public.profiles u
  where u.is_demo and u.id <> r.user_id and random() < 0.18
  on conflict do nothing;

  insert into public.comment_likes (comment_id, user_id)
  select c.id, u.id from public.review_comments c
  join public.profiles a on a.id = c.user_id and a.is_demo
  cross join public.profiles u
  where u.is_demo and u.id <> c.user_id and random() < 0.4
  on conflict do nothing;

  -- Abonnements entre eux.
  insert into public.follows (follower_id, following_id)
  select f.id, t.id from public.profiles f cross join public.profiles t
  where f.is_demo and t.is_demo and f.id <> t.id and random() < 0.5
  on conflict do nothing;

  -- Votes pour la Pépite de la semaine en cours.
  insert into public.weekly_votes (user_id, album_id, album_title, artist_name, cover_url)
  select p.id, r.album_id, r.album_title, r.artist_name, r.cover_url
  from (values ('awa.kone', 'damini-moussa'), ('koffi225', 'damini-moussa'), ('moussa.beats', 'damini-moussa'),
               ('marie.sound', 'sos-marie'), ('lea.playlist', 'sos-marie')) v(username, review_key)
  join public.profiles p on p.username = v.username
  join demo_review_ids d on d.key = v.review_key
  join public.reviews r on r.id = d.id
  on conflict do nothing;

  -- Les notifications créées entre membres de démo ne servent à personne.
  delete from public.notifications n
  using public.profiles p
  where p.id = n.user_id and p.is_demo;

  raise notice 'Membres de démo créés : % avis.', (select count(*) from demo_review_ids);
end;
$$;

drop table if exists demo_users, demo_reviews, demo_comments, demo_review_ids, demo_comment_ids;
