# Pépite

Un réseau social pour noter et critiquer des albums (un peu comme Letterboxd, mais pour la musique).

- **Fil** : les derniers avis de la communauté
- **Recherche** : tous les albums du catalogue Deezer, par titre ou par artiste
- **Page album** : pochette, titres avec extraits de 30 s, note moyenne, ta note de 1 à 5 étoiles et ton avis
- **Page titre** : chaque chanson se note et se critique aussi
- **Profil** : tes stats, tes notes récentes, ta bio

Fait avec [Next.js](https://nextjs.org) (le site), [Supabase](https://supabase.com) (comptes et base de données) et l'[API Deezer](https://developers.deezer.com/api) (les albums, sans clé).

## Lancer le site sur ton ordinateur

Il te faut [Node.js](https://nodejs.org) (version 20 ou plus).

```bash
npm install
npm run dev
```

Puis ouvre http://localhost:3000. Sans Supabase, la recherche et les pages d'album marchent déjà, mais pas les comptes ni les avis.

## Brancher Supabase (une seule fois, environ 10 minutes)

Supabase garde les comptes des membres et leurs avis. C'est gratuit pour un petit projet.

1. **Crée un compte** sur https://supabase.com, puis clique sur **New project**. Donne-lui un nom (par exemple `pepite`), choisis un mot de passe pour la base (garde-le de côté) et la région la plus proche (Paris). Attends une minute que le projet soit prêt.
2. **Crée les tables** : dans le menu de gauche, ouvre **SQL Editor**, colle tout le contenu du fichier [`supabase/schema.sql`](supabase/schema.sql), puis clique sur **Run**. Tu dois voir « Success ».
3. **Récupère les clés** : clique sur **Connect** en haut de la page (ou va dans **Project Settings > API Keys**). Copie l'**URL du projet** et la **clé publishable** (elle commence par `sb_publishable_` ; sur un ancien projet, c'est la clé `anon`).
4. **Colle-les dans le projet** : copie le fichier `.env.example` en `.env.local`, puis remplace les deux valeurs :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
   Ce fichier reste sur ton ordinateur : il n'est jamais envoyé sur GitHub.
5. **Relance** `npm run dev`. Le message en haut du site disparaît : tu peux créer un compte.

### Mise à jour « réseau social »

Les photos de profil, favoris, abonnements, « j'aime », commentaires et listes ont besoin de nouvelles tables. Une fois le code de cette mise à jour en ligne, colle le fichier [`supabase/02-reseau-social.sql`](supabase/02-reseau-social.sql) dans **SQL Editor** et clique sur **Run** (une seule fois).

### Mise à jour « chansons »

Pour noter aussi chaque chanson, colle ensuite [`supabase/03-chansons.sql`](supabase/03-chansons.sql) dans **SQL Editor** et clique sur **Run** (une seule fois, juste après la mise en ligne du code).

### Pour tester plus vite (facultatif)

Par défaut, Supabase envoie un e-mail de confirmation à chaque inscription. Pendant tes tests, tu peux le couper dans **Authentication > Sign In / Providers > Email**, en décochant **Confirm email**.

Si tu le laisses activé, va dans **Authentication > URL Configuration** et mets `http://localhost:3000` dans **Site URL** (et plus tard l'adresse en ligne de ton site), sinon le lien de l'e-mail ne ramènera pas au bon endroit.

## Comment le code est rangé

| Dossier | Ce qu'il contient |
| --- | --- |
| `app/` | Les pages : `page.tsx` (fil), `album/[id]`, `titre/[id]`, `artiste/[id]`, `avis/[id]`, `listes/[id]`, `profil/[username]`, `connexion` |
| `app/social-actions.ts` | J'aime, commentaires, abonnements, favoris et listes |
| `app/api/search` | La recherche, qui interroge Deezer depuis le serveur (Deezer bloque les appels directs du navigateur) |
| `components/` | Les morceaux réutilisés : barre du haut, étoiles, carte d'avis… |
| `lib/deezer.ts` | Les appels à l'API Deezer |
| `lib/data.ts` | Les lectures dans Supabase |
| `supabase/` | La structure de la base et ses règles de sécurité, dans l'ordre : `schema.sql`, `02-reseau-social.sql`, puis `03-chansons.sql` |
