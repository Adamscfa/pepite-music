# Pépite

Un réseau social pour noter et critiquer des albums (un peu comme Letterboxd, mais pour la musique).

- **Fil** : les derniers avis de la communauté
- **Recherche** : tous les albums du catalogue Deezer, par titre ou par artiste
- **Page album** : pochette, titres avec extraits de 30 s, note moyenne, ta note de 1 à 5 étoiles et ton avis
- **Page titre** : chaque chanson se note et se critique aussi
- **Profil** : tes stats, tes notes récentes, ta bio

Pour savoir où en est le projet et quoi faire ensuite, voir [`SUIVI.md`](SUIVI.md).

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

### Mise à jour « notifications, messages et Pépite de la semaine »

Notifications, réactions en emoji, coup de cœur, signalements, messages privés entre amis et votes de la semaine : colle [`supabase/04-ameliorations.sql`](supabase/04-ameliorations.sql) dans **SQL Editor** et clique sur **Run** (une seule fois, juste après la mise en ligne du code, et après `03-chansons.sql`).

### Réponses aux commentaires

Pour pouvoir répondre à un commentaire et aimer un commentaire : colle [`supabase/05-reponses-commentaires.sql`](supabase/05-reponses-commentaires.sql) dans **SQL Editor** et clique sur **Run** (une seule fois, après `04-ameliorations.sql`). Sans lui, les commentaires simples marchent toujours, mais pas les réponses.

### Messages et notifications en direct

Pour que les messages et les notifications arrivent sans rafraîchir la page : colle [`supabase/07-temps-reel.sql`](supabase/07-temps-reel.sql) dans **SQL Editor** et clique sur **Run** (une seule fois). Sans lui, ils s'affichent quand on revient sur la page.

### Grande mise à jour (appli, premier pas, mentions, modération)

Colle [`supabase/08-grande-mise-a-jour.sql`](supabase/08-grande-mise-a-jour.sql) dans **SQL Editor** et clique sur **Run** (une seule fois, après le fichier 07). Il ajoute : les genres préférés et le premier pas des nouveaux membres, les appareils abonnés aux notifications, les mentions @pseudo, la modération et le suivi des erreurs.

### Notifications sur le téléphone

Il faut deux clés (une publique, une secrète), à ajouter dans **Vercel > Settings > Environment Variables**, pour Production et Preview :

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY` (secrète : ne la mets jamais dans ce dépôt)

Puis **Deployments > Redeploy**. Chaque membre active ensuite les notifications depuis le menu de gauche ou sa page de profil. Sur iPhone, il faut d'abord installer Pépite sur l'écran d'accueil (Safari > Partager > Sur l'écran d'accueil).

Pour créer de nouvelles clés : `node -e "const c=require('crypto');const {privateKey}=c.generateKeyPairSync('ec',{namedCurve:'prime256v1'});const j=privateKey.export({format:'jwk'});console.log('PUBLIC',Buffer.concat([Buffer.from([4]),Buffer.from(j.x,'base64url'),Buffer.from(j.y,'base64url')]).toString('base64url'));console.log('PRIVATE',j.d)"`

### Devenir administrateur (page Modération)

Dans Supabase, **Table Editor > profiles**, trouve ta ligne et mets la colonne `is_admin` sur `true`. Un lien **Modération** apparaît dans le menu : avis signalés (masquer, réafficher, supprimer) et erreurs du site.

### Lancement (contact, blocage, anti-spam, annonces)

Colle [`supabase/10-lancement.sql`](supabase/10-lancement.sql) dans **SQL Editor** et clique sur **Run** (une seule fois, après le fichier 08). Il ajoute : les messages de la page Contact, la suppression de compte, le blocage d'un membre, la limite anti-spam (20 commentaires ou messages par minute) et les annonces de la semaine.

### Liens d'invitation

Colle [`supabase/11-invitations.sql`](supabase/11-invitations.sql) dans **SQL Editor** et clique sur **Run** (une seule fois, après le fichier 10). Chaque membre trouve ensuite son lien `/invite/<pseudo>` sur son profil (encart « Invite tes amis »).

### E-mails d'inscription fiables, en français

L'expéditeur fourni par Supabase n'envoie que quelques e-mails par heure. On branche **Brevo** (gratuit jusqu'à 300 e-mails par jour) :

1. Crée un compte sur **brevo.com**. Dans **Expéditeurs** (Senders), ajoute et confirme l'adresse qui enverra les e-mails.
2. Dans Brevo, **SMTP & API** > onglet **SMTP** : note l'identifiant (login) et crée une **clé SMTP**.
3. Dans Supabase, **Authentication > Emails > SMTP Settings** : active **Custom SMTP** et remplis :
   - Sender email : l'adresse confirmée à l'étape 1 · Sender name : `Pépite`
   - Host : `smtp-relay.brevo.com` · Port : `587`
   - Username : l'identifiant Brevo · Password : la clé SMTP
4. Dans Supabase, **Authentication > Rate Limits** : monte la limite d'e-mails par heure (par exemple 100).
5. Dans Supabase, **Authentication > URL Configuration** : **Site URL** = l'adresse du site en ligne, et dans **Redirect URLs** ajoute `https://ton-site/**` (pour le lien « Mot de passe oublié »).
6. Les e-mails en français : suis [`supabase/emails/LISEZ-MOI.md`](supabase/emails/LISEZ-MOI.md).

### Rendez-vous de la semaine (notifications automatiques)

Chaque lundi à 9 h, les membres qui ont activé les notifications reçoivent la Pépite de la semaine ; chaque jeudi à 18 h, ceux qui n'ont pas voté reçoivent un rappel (heures de Côte d'Ivoire). Vercel s'en charge tout seul (fichier `vercel.json`). Il faut ajouter dans **Vercel > Settings > Environment Variables** (Production) :

- `CRON_SECRET` : un long mot de passe inventé (au moins 20 caractères)
- `SUPABASE_SERVICE_ROLE_KEY` : dans Supabase, **Project Settings > API Keys**, la clé **service_role** (ou « secret »). Elle est très sensible : uniquement dans Vercel, jamais ailleurs.

Puis **Redeploy**.

### Membres de démonstration (facultatif)

Pour que le site ne soit pas vide au lancement : colle [`supabase/06-comptes-demo.sql`](supabase/06-comptes-demo.sql) dans **SQL Editor** et clique sur **Run** (une seule fois, après le fichier 05). Il crée 8 membres imaginaires avec des avis sur de vrais albums, des commentaires, des réponses, des « j'aime » et des abonnements. Ils sont marqués **Démo** sur le site, et personne ne peut se connecter à leurs comptes.

Quand de vrais membres sont arrivés, colle [`supabase/demo-supprimer.sql`](supabase/demo-supprimer.sql) dans **SQL Editor** et clique sur **Run** pour tout effacer.

Les avis signalés se trouvent dans **Table Editor > reports**. Un avis signalé par 3 membres est masqué automatiquement (colonne `hidden` de la table `reviews` : remets-la sur `false` pour le réafficher).

### Connexion avec Google (facultatif)

Le bouton « Continuer avec Google » ne marche qu'une fois Google branché dans Supabase :

1. Sur [console.cloud.google.com](https://console.cloud.google.com), crée un projet, puis **APIs et services > Identifiants > Créer des identifiants > ID client OAuth** (type « Application Web »).
2. Dans **URI de redirection autorisés**, colle l'adresse donnée par Supabase dans **Authentication > Sign In / Providers > Google** (elle finit par `/auth/v1/callback`).
3. Recopie l'**ID client** et le **Code secret** dans cette page Supabase, active Google et enregistre.

Le pseudo des comptes Google est fabriqué à partir de l'e-mail ; le membre peut changer son nom affiché sur son profil.

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
| `supabase/` | La structure de la base et ses règles de sécurité, dans l'ordre : `schema.sql`, `02-reseau-social.sql`, `03-chansons.sql`, `04-ameliorations.sql`, `05-reponses-commentaires.sql`, (facultatif) `06-comptes-demo.sql`, `07-temps-reel.sql`, `08-grande-mise-a-jour.sql`, `09-corriger-demo.sql`, `10-lancement.sql`, puis `11-invitations.sql` ; `demo-supprimer.sql` efface les membres de démo |
