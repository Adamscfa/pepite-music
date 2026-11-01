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

Aussi en place : connexion par e-mail et avec Google, thème clair/sombre,
images de partage (aperçus de liens et « story » d'un avis), page artiste.

## Base de données Supabase

Les fichiers du dossier `supabase/` se collent un par un dans
**SQL Editor > Run**, une seule fois chacun, dans cet ordre :

| Fichier | Pour quoi | Exécuté ? |
| --- | --- | --- |
| `schema.sql` | Comptes, albums, avis | oui |
| `02-reseau-social.sql` | Abonnements, j'aime, commentaires, listes | oui |
| `03-chansons.sql` | Notes des chansons | à vérifier |
| `04-ameliorations.sql` | Notifications, messages, Pépite de la semaine | oui |
| `05-reponses-commentaires.sql` | Réponses aux commentaires, j'aime sur commentaires | oui |

Remplacer « à vérifier » par « oui » une fois confirmé (01, 02, 04 et 05 vérifiés le 1er novembre 2026). Pour vérifier, dans
Supabase, **Table Editor** :
- fichier 01 : les tables `profiles` et `reviews` existent
- fichier 02 : la table `follows` existe
- fichier 03 : la table `reviews` a une colonne `track_id`
- fichier 04 : la table `notifications` existe
- fichier 05 : la table `comment_likes` existe

Les clés Supabase (URL du projet et clé publishable) ne sont **jamais** dans ce
dépôt. Elles sont dans les réglages du projet Vercel (Environment Variables) et
dans le fichier `.env.local` sur l'ordinateur. À garder aussi en lieu sûr.

## Prochaines étapes

- [ ] Confirmer le fichier 03 : la table `reviews` a-t-elle une colonne `track_id` ?
- [ ] Fusionner la pull request n°11 (nouvelle interface)
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
