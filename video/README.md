# Squelette vidéo hebdomadaire Pépite

Ce dossier fournit le premier bloc du projet : requêtes de sélection, consigne
éditoriale, format JSON et composition Remotion de duel. Il **ne déclenche pas**
encore Claude, ne rend pas les vidéos automatiquement et ne publie rien sur les
réseaux.

## Ce qui est prêt

- `supabase/14-video-queue.sql` : requêtes réservées au worker (`video_weekly_vote_top`
  pour les votes de la « Pépite de la semaine », `video_weekly_top` pour les avis
  récents, `video_most_commented` et `video_duel_candidates`), une file privée,
  et un bucket privé pour les MP4.
- `video/claude-editorial-prompt.md` : consigne à fournir à l'API Claude.
- `video/schemas/duel-editorial.schema.json` : forme attendue de sa réponse.
- `video/remotion/` : projet Remotion autonome et composition verticale de duel.

Les moyennes et les nombres affichés dans la vidéo viennent des requêtes SQL,
jamais de Claude. Les avis cachés et tous les profils Démo sont exclus. Les
commentaires Démo ne comptent pas non plus.

## Installation Supabase — à faire par la propriétaire

Dans Supabase, ouvre **SQL Editor**, colle le contenu de `supabase/14-video-queue.sql`
et clique sur **Run** une seule fois, après `13-suppressions.sql`. Le script ajoute
la file, les requêtes de sélection réservées à `service_role` et le bucket privé
`weekly-videos`.

Les admins peuvent voir et mettre à jour la file depuis une interface serveur
authentifiée. Les visiteurs n'ont aucun accès à la file ni aux vidéos. Le worker
doit utiliser `SUPABASE_SERVICE_ROLE_KEY` uniquement dans son environnement
serveur ; ne jamais la mettre dans le navigateur ou dans GitHub.

## Préparer la composition Remotion

Depuis ce dossier :

```powershell
cd video\remotion
npm install
npm run preview
```

Le projet de rendu est indépendant du site Next.js et de Vercel. Pour créer un
aperçu MP4 avec les valeurs d'exemple :

```powershell
npm run render
```

Les fichiers sortent dans `video/remotion/out/` (ignoré par Git). Le fichier
`Duel.tsx` est le modèle à adapter ; remplace les URLs d'exemple par les pochettes
présentes dans les données de duel. Ne lance pas le rendu dans une route ou une
fonction Vercel.

## Limites et prochaine étape

Pour automatiser le flux complet, il reste à créer le worker planifié qui lit les
fonctions SQL, appelle l'API Claude, valide le JSON, rend la vidéo, l'envoie dans
le bucket privé et crée une ligne `video_queue` en statut `pending`. La page
`/admin/videos`, les boutons d'approbation et toute publication Instagram/TikTok
restent à construire. Aucune publication ne doit partir sans approbation humaine.

Il faudra fournir séparément une clé API Anthropic au worker. L'abonnement Claude
Pro ne remplace pas l'accès à l'API. Les pochettes Deezer sont protégées par des
droits : ce squelette ne vérifie pas les autorisations de republication.
