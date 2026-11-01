# Suivi du projet Pépite

Ce fichier sert de mémoire au projet. Il dit où on en est et quoi faire ensuite,
pour pouvoir reprendre le travail depuis n'importe quel compte ou n'importe quelle
conversation. **À mettre à jour à chaque nouvelle étape.**

Dernière mise à jour : 1er novembre 2026

## Le projet en bref

Pépite est un réseau social pour noter et critiquer des albums et des chansons
(un peu comme Letterboxd, mais pour la musique).

- **Code** : ce dépôt GitHub, `Adamscfa/pepite-music`
- **Site** : Next.js 16 (dossier `app/`)
- **Comptes et base de données** : Supabase
- **Albums, titres, pochettes, extraits** : API Deezer (sans clé)
- **Mise en ligne** : Vercel, branché sur ce dépôt. Chaque changement fusionné
  dans la branche `main` est publié automatiquement (région Paris, `cdg1`).

Le README explique comment lancer le site et brancher Supabase pas à pas.

## Ce qui est fait

Tout a été construit le 25 octobre 2026 (pull requests n°1 à n°8).

1. Création de l'app : fil d'avis, recherche Deezer, page album avec note de
   1 à 5 étoiles et avis, profil (n°1)
2. Albums du moment sur l'accueil (n°2)
3. Logo Pépite dans la barre du haut et l'onglet (n°3)
4. Réseau social : photos de profil, favoris, abonnements, « j'aime »,
   commentaires, listes (n°4)
5. Recherche et notes des chansons, page titre (n°5)
6. Notifications, réactions emoji, coup de cœur, signalements, messages privés
   entre amis, « Pépite de la semaine » et nouveau design (n°6)
7. Page Classements : tops Deezer France et Monde, par genre (n°7)
8. Classements : choisir le top d'un autre pays (n°8)

9. Nouvelle interface (1er novembre 2026) : barre latérale vert très sombre,
   couleurs vertes d'origine gardées (vert du logo, vert néon en mode sombre),
   grande barre de recherche, bandeau d'accueil qui défile, cartes
   d'avis avec les derniers commentaires, colonne de droite (albums tendance,
   top contributeurs). Nouvelle page **Explorer** (nouveaux artistes, albums
   tendance, genres, titres et albums les plus commentés). **Réponses aux
   commentaires** et « j'aime » sur les commentaires, avec tri Top / récents.
10. Membres de démonstration (1er novembre 2026) : 8 membres imaginaires,
    marqués « Démo » sur le site, avec avis, commentaires, réponses et
    « j'aime » sur de vrais albums. Fichier `06-comptes-demo.sql` ; on les
    efface tous avec `demo-supprimer.sql`.
11. Messages et notifications en direct (1er novembre 2026) : un nouveau
    message apparaît tout seul dans la conversation ouverte, et les pastilles
    du menu se mettent à jour sans rafraîchir. Fichier `07-temps-reel.sql`.
12. Messages façon WhatsApp (1er novembre 2026) : coches « envoyé » et
    « lu » (bleues), heure sur chaque message, emojis en grand et en couleur,
    barre d'écriture collée en bas (Entrée pour envoyer). Les messages ne sont
    plus répétés dans les notifications.
13. Grande mise à jour (1er novembre 2026) :
    - **Appli installable** (icône sur l'écran d'accueil) et **notifications
      sur le téléphone** (messages, j'aime, commentaires, réponses, mentions,
      abonnements). Clés VAPID à mettre dans Vercel.
    - **Premier pas** des nouveaux membres (`/bienvenue`) : genres préférés,
      3 albums à noter, membres à suivre.
    - **Partage sur WhatsApp** sur chaque avis.
    - **Musique d'ici** dans Explorer : Top Côte d'Ivoire, coupé-décalé,
      zouglou, rap ivoirien, afrobeats.
    - **Pour toi** : recommandations d'après tes notes.
    - **Ton année en musique** (`/profil/<pseudo>/annee`).
    - Messages : « en train d'écrire… », « Vu à », jours, recommander un
      album depuis la conversation.
    - **Mentions @pseudo** dans les commentaires (avec notification).
    - **Modération** (`/moderation`, pour les administrateurs) et **suivi des
      erreurs** du site.
14. Téléphone (1er novembre 2026) : menu du bas avec de vraies icônes et
    bouton « Publier » au centre, cartes d'avis compactes, bandeau plus
    court, pas de zoom automatique sur iPhone, thème dans le menu du compte.
    Nouvelle icône de lecture des extraits (cercle au trait + triangle).
15. Lancement (1er novembre 2026) : mot de passe oublié, e-mails en français
    (`supabase/emails/`), pages Confidentialité / Conditions / Contact,
    suppression de compte, bloquer un membre, limite anti-spam, fil chargé par
    15 avis avec « Voir plus », notifications automatiques le lundi (Pépite de
    la semaine) et le jeudi (rappel de vote).
16. Faire venir du monde (1er novembre 2026) : **lien d'invitation** personnel
    (`/invite/<pseudo>`, abonnement mutuel dès l'inscription, compteur et
    encart « Invite tes amis » sur son profil) et **images verticales à poster**
    (`/partager` : Pépite de la semaine, top 5 de la semaine). Fichier
    `11-invitations.sql`.

Aussi en place : connexion par e-mail et avec Google, thème clair/sombre,
images de partage (aperçus de liens et « story » d'un avis), page artiste.

## Base de données Supabase

Les fichiers du dossier `supabase/` se collent un par un dans
**SQL Editor > Run**, une seule fois chacun, dans cet ordre :

| Fichier | Pour quoi | Exécuté ? |
| --- | --- | --- |
| `schema.sql` | Comptes, albums, avis | oui |
| `02-reseau-social.sql` | Abonnements, j'aime, commentaires, listes | oui |
| `03-chansons.sql` | Notes des chansons | oui |
| `04-ameliorations.sql` | Notifications, messages, Pépite de la semaine | oui |
| `05-reponses-commentaires.sql` | Réponses aux commentaires, j'aime sur commentaires | oui |
| `06-comptes-demo.sql` | Membres de démonstration (facultatif) | à vérifier |
| `07-temps-reel.sql` | Messages et notifications en direct | à vérifier |
| `08-grande-mise-a-jour.sql` | Premier pas, notifications téléphone, mentions, modération, erreurs | à vérifier |
| `09-corriger-demo.sql` | Retire « Démo » des vrais membres (sans risque, rejouable) | à vérifier |
| `10-lancement.sql` | Contact, suppression de compte, blocage, anti-spam, annonces | à vérifier |
| `11-invitations.sql` | Liens d'invitation (parrainage) | non (à faire) |

Remplacer « à vérifier » par « oui » une fois confirmé. Pour vérifier, dans
Supabase, **Table Editor** :
- fichier 01 : les tables `profiles` et `reviews` existent
- fichier 02 : la table `follows` existe
- fichier 03 : la table `reviews` a une colonne `track_id`
- fichier 04 : la table `notifications` existe
- fichier 05 : la table `comment_likes` existe
- fichier 06 : des membres marqués « Démo » apparaissent sur l'accueil
- fichier 07 : dans Database > Publications > supabase_realtime, les tables
  `messages` et `notifications` sont cochées
- fichier 08 : les tables `push_subscriptions` et `errors` existent
- fichier 10 : les tables `blocks`, `contact_messages` et `announcements` existent
- fichier 11 : la table `referrals` existe

Les clés Supabase (URL du projet et clé publishable) ne sont **jamais** dans ce
dépôt. Elles sont dans les réglages du projet Vercel (Environment Variables) et
dans le fichier `.env.local` sur l'ordinateur. À garder aussi en lieu sûr.

## Prochaines étapes

- [x] Fichiers SQL 01 à 05 exécutés (vérifiés le 1er novembre 2026)
- [x] Nouvelle interface en ligne (pull request n°11)
- [ ] Confirmer que `06-comptes-demo.sql` a bien marché (membres « Démo » sur l'accueil)
- [ ] Exécuter `07-temps-reel.sql` (si ce n'est pas fait), puis `08-grande-mise-a-jour.sql`
- [ ] Ajouter les clés `NEXT_PUBLIC_VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY` dans Vercel, puis redéployer
- [ ] Se mettre administrateur (`is_admin` dans la table `profiles`)
- [ ] Exécuter `10-lancement.sql`, puis `11-invitations.sql`
- [ ] Brancher Brevo pour les e-mails et coller les modèles en français (README)
- [ ] Ajouter `CRON_SECRET` et `SUPABASE_SERVICE_ROLE_KEY` dans Vercel (README)
- [ ] Faire relire les pages Confidentialité et Conditions, et vérifier la déclaration auprès de l'ARTCI
- [ ] Quand assez de vrais membres sont inscrits : exécuter `demo-supprimer.sql`
- [ ] Vérifier que le site en ligne sur Vercel marche avec la dernière version
- [ ] (idées à ajouter ici)

## Reprendre le projet depuis un autre compte

1. Sur claude.ai, relier un compte GitHub qui a accès à ce dépôt
   (Paramètres > Connecteurs > GitHub).
2. Le dépôt est public : n'importe quel compte peut le lire. Pour **modifier**
   le code, le compte GitHub doit être celui d'Adamscfa ou être ajouté comme
   collaborateur (GitHub > dépôt > Settings > Collaborators).
3. Demander à Claude de reprendre le projet `Adamscfa/pepite-music` : il lira ce
   fichier pour savoir où on en est.

## Habitudes de travail

- Les changements se font sur une branche, puis une pull request est fusionnée
  dans `main` (ce qui met le site en ligne sur Vercel).
- Quand un changement demande une modification de la base, il vient avec un
  nouveau fichier `supabase/0X-....sql`, à ajouter au tableau ci-dessus et au
  README.
- Les textes du site, du README et de ce fichier sont en français, simples, pour
  une personne qui n'est pas développeuse.
