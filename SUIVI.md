# Suivi du projet Pépite

Ce fichier sert de mémoire au projet. Il dit où on en est et quoi faire ensuite,
pour pouvoir reprendre le travail depuis n'importe quel compte ou n'importe quelle
conversation. **À mettre à jour à chaque nouvelle étape.**

Dernière mise à jour : 12 novembre 2026

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
    encart « Invite tes amis » sur son profil). Fichier `11-invitations.sql`.
    (Les images à poster `/partager` ont été retirées à la demande.)
17. Tendances de chez soi (1er novembre 2026) : la page Classements, les albums
    et titres tendance (accueil, colonne de droite, téléphone, Explorer)
    suivent le **pays du visiteur** (en-tête Vercel `x-vercel-ip-country`,
    relié au « Top <pays> » de Deezer, `lib/trends.ts`). Un pays, le Monde ou
    la France choisi sur Classements est retenu un an (cookie `top_pays`, posé
    dans `proxy.ts`). Sans pays trouvé : la France, comme avant. Ne marche que
    sur Vercel (en local, toujours la France). Aucun SQL.
18. Classement d'un pays ou du Monde affiché comme celui de la France
    (1er novembre 2026) : top albums, top artistes et top titres, tirés du
    « Top <pays> » de Deezer (`getPlaylistChart` dans `lib/deezer.ts`).
    Un artiste sans photo chez Deezer (image grise) prend la pochette de son
    titre classé. Le « Top UK » de Deezer est vide pour l'instant.
    Par genre (Rap, Jazz…), Deezer renvoie toujours les mêmes « top artistes » :
    on les tire désormais des titres du genre.
19. Noms des pays en français (1er novembre 2026) : « Top Côte d'Ivoire »,
    « Top Sénégal », « en Côte d'Ivoire », « au Sénégal »… (`lib/country-names.ts`).
20. Studio TikTok (1er novembre 2026), page `/studio`, réservée aux admins (lien
    dans le menu) : choisir un thème (top d'un pays, Top Monde, mieux notés sur
    Pépite, sorties, au hasard), albums ou titres, 5 ou 10. Pépite prépare un
    carrousel d'images verticales 1080 × 1920 (couverture, une image par album
    avec son rang, image de fin « Lien en bio ») et le texte avec hashtags.
    Bouton pour tout enregistrer (menu de partage sur téléphone). La
    publication sur TikTok se fait à la main (carrousel photo, programmation
    dans TikTok Studio) : TikTok limite et contrôle la publication automatique.
    Accéléré : plus de recherche des photos d'artistes, images gardées une
    journée par le navigateur (l'enregistrement ne les refabrique plus).
    Images recadrées pour la zone sûre de TikTok (rien sous la barre du haut,
    le texte du bas ni les boutons de droite), police Inter en gras ;
    enregistrement en JPEG par paquets de 4 (12 d'un coup échouait sur Android).
21. Tableau de bord (2 novembre 2026), page `/tableau-de-bord`, réservée aux
    admins : membres inscrits (démo exclus), nouveaux du jour / 7 / 30 jours,
    actifs de la semaine, premier pas terminé, avis et commentaires,
    inscriptions par jour sur 30 jours, les plus suivis, les plus actifs et les
    50 derniers inscrits. Aucun e-mail ni message privé affiché. Aucun SQL.
22. Accueil plus rapide (2 novembre 2026) : tendances, top contributeurs,
    Pépite de la semaine et compteurs préparés une seule fois par visite
    (`lib/home.ts`, partagés entre la colonne de droite et les bandeaux du
    téléphone), gardés 5 minutes pour tout le monde (donc jusqu'à 5 minutes de
    retard sur ces chiffres), et affichés juste après le reste de la page avec
    des emplacements gris en attendant (`components/HomeSkeletons.tsx`).
23. Profil modifiable (4 novembre 2026) : sur son profil, chaque membre peut
    changer son nom, son pseudo `@`, sa bio et sa photo. L'édition suit le
    nouveau modèle : photo centrée, bouton « Modifier », puis sections « About »,
    « Nom » et « Identifiant » avec édition au crayon. Les relations restent
    attachées à l'ID du compte ; les anciennes adresses de profil, d'invitation
    et mentions continuent de pointer vers le membre après un changement de
    pseudo. Fichier `12-pseudos-modifiables.sql` (après le 11) pour les alias.
24. Langues (4 novembre 2026) : français, anglais et espagnol. À la première
    visite, Pépite suit la langue préférée du navigateur (`es-ES` compris) ;
    si le navigateur n'indique aucune langue prise en charge, les visiteurs
    situés en Espagne (en-tête Vercel `x-vercel-ip-country`) voient l'espagnol.
    Le choix peut être modifié et retenu dans **Paramètres > Langue** (cookie
    local, aucun SQL). Navigation, accueil, recherche, connexion, Explorer,
    classements et réglages principaux sont traduits. Les textes des autres
    pages restent à traduire.
25. Contraste du menu de langue (4 novembre 2026) : texte des choix et options
    rendu lisible dans les réglages, avec les thèmes clair et sombre.
26. Studio TikTok (4 novembre 2026) : cliquer une image ou un paquet sur ordinateur
    télécharge les fichiers au lieu d’ouvrir le menu de partage. Sur téléphone,
    le partage natif reste disponible pour enregistrer dans la galerie.
27. Confidentialité (4 novembre 2026) : la page présente désormais des
    informations générales sur la protection des données, sans mentionner de
    loi, d'autorité ni de pays en particulier.
28. Ancienne version du Studio conservée (5 novembre 2026) : carrousel de
    couvertures et tops Deezer d'albums, titres ou artistes, avec téléchargement.
    La nouvelle option « affiche Top 10 » a été retirée après des erreurs
    persistantes sur le site.
29. Profil et icônes (5 novembre 2026) : l'éditeur de profil garde toute sa
    largeur sur téléphone au lieu d'être tassé dans une colonne. La recommandation
    d'album utilise une enveloppe avec @ et le lien « Mon année en musique »
    affiche une icône de profil avec graphique.
30. Supprimer messages et notifications (5 novembre 2026) : sur chaque message
    qu'on a envoyé, un menu « ⋮ » apparaît au survol de la bulle, avec « Supprimer
    le message » (deux clics pour confirmer : il disparaît chez les deux, comme
    sur WhatsApp). Dans la liste des conversations, un bouton corbeille vide toute
    la conversation avec un ami (🗑 puis clic de confirmation). Sur chaque
    notification, une croix « ✕ » pour l'effacer. Fichier `13-suppressions.sql`
    à exécuter après le 12 : il autorise la suppression dans la base et ajoute la
    fonction `delete_thread`.
31. Boutons album (5 novembre 2026) : l'enveloppe de recommandation est alignée
    à gauche et prend la couleur Pépite quand le formulaire s'ouvre. Le cœur des
    favoris devient rose après l'ajout et reste coloré si l'album est déjà favori.
32. Chargement plus fluide (5 novembre 2026) : la page d'un album récupère en
    même temps les données Deezer, les avis et la session, au lieu d'attendre
    chaque étape l'une après l'autre. Aucun changement visuel ou SQL.
33. Messages sur téléphone (5 novembre 2026) : comme WhatsApp, le nom de l'ami
    reste en haut, les messages défilent dans leur propre zone et la barre
    d'écriture reste juste au-dessus du clavier. La fenêtre suit le clavier sur
    les navigateurs Android compatibles. Aucun changement SQL.
34. Défilement de la conversation (5 novembre 2026) : sur téléphone, l'en-tête,
    les messages et la saisie occupent trois rangées distinctes. Le fil a sa
    propre zone défilante et le clavier redimensionne toujours la conversation.
    La page elle-même reste verrouillée pendant la conversation : seul le fil
    défile, sans déplacer le cadre.
35. Requêtes des contributeurs (5 novembre 2026) : l'accueil et Explorer ne
    récupèrent plus toutes les colonnes de 3 000 avis pour compter les membres ;
    seules les données de comptage et les champs de profil affichés sont lus.
    Aucun changement visuel ou SQL.
36. Préparation Play Store (5 novembre 2026) : configuration Android en Trusted
    Web Activity (`android/twa-manifest.json`) et route d'association au domaine
    (`/.well-known/assetlinks.json`) prêtes. La publication attend le compte Play
    Console du propriétaire, la clé de signature et son empreinte SHA-256 dans
    Vercel. Voir `android/LISEZ-MOI.md`.
37. Menu du compte (5 novembre 2026) : retrait du raccourci « Messages » (déjà
    disponible dans la barre du bas) et du choix de langue (déjà dans Paramètres).
    Les liens Messages et Langue dans leurs emplacements habituels restent actifs.
38. Barre du haut sur téléphone (5 novembre 2026) : pour les visiteurs non
    connectés, le logo et la recherche restent sur la première ligne ; paramètres,
    langue et thème sont alignés sur une deuxième ligne. Le bouton d'inscription
    du haut est masqué car l'inscription est déjà dans la barre du bas.
39. Barre mobile des visiteurs (5 novembre 2026) : masquage de toute la rangée
    Paramètres / Langue / Thème sur téléphone pour garder un en-tête compact.
    Les réglages restent disponibles sur ordinateur et dans Paramètres.
40. Thème sur téléphone (5 novembre 2026) : l'icône de changement de thème est
    placée à côté de la recherche pour tous les visiteurs, connectés ou non.
41. Prototype vidéo hebdomadaire (10 novembre 2026) : un premier squelette SQL,
    Remotion et une page admin ont été ajoutés, puis retirés à la demande.
42. Retrait de la file vidéo (10 novembre 2026) : suppression de la page d'envoi
    et de validation, des liens admin et des sources Remotion. Si les SQL 14 ou
    15 ont été exécutés, supprimer d'abord les MP4 dans **Supabase > Storage >
    weekly-videos**, puis exécuter `supabase/16-retirer-videos.sql`. Cela ne
    touche pas aux colonnes `is_admin` et `is_demo`, utilisées ailleurs.
43. Affiche Top 10 dans le Studio (12 novembre 2026) : nouveau choix **Format >
    Affiche Top 10** sur `/studio`. Une seule image 1080 × 1350 (format 4:5 des
    publications photo TikTok et Instagram) : grand titre (« TOP 10 TITRES »),
    pays et « cette semaine », deux colonnes de 5 avec rang, pochette, titre et
    artiste, fond de couleur pointillé, logo Pépite et adresse du site en bas.
    Marche avec tous les thèmes (top d'un pays, Monde, mieux notés, sorties, au
    hasard) et les albums, titres ou artistes. La couleur suit le drapeau du pays
    (orange pour la Côte d'Ivoire, vert pour le Sénégal ou le Nigeria, rouge pour
    le Kenya, bleu pour la France ou l'Afrique du Sud…) et peut être changée dans
    **Couleur**. Code : `lib/studio-poster.tsx`. Pour éviter les pannes de la
    première version (n°28) : textes toujours d'un seul bloc, pochettes
    téléchargées à l'avance avec 4 secondes maximum, case vide si Deezer ne répond
    pas. Aucun SQL.
44. Vidéos dans le Studio (12 novembre 2026) : deux nouveaux formats dans
    **Format** sur `/studio`. **Vidéo « Ta note ? »** (environ 18 s) : accroche
    modifiable (« Quel album mérite… 5 ÉTOILES ? »), puis 4 albums, un par un,
    avec « Ta note ? » et les étoiles qui se remplissent. **Vidéo duel**
    (environ 14 s) : « DUEL D'ALBUMS », puis 2 manches « 1 VS 2 » avec « Qui
    gagne ? Commente 1 ou 2 ». Les deux finissent par « Crée ton compte » et
    l'adresse du site. Vidéos 1080 × 1920, **muettes** (la musique s'ajoute dans
    TikTok). Elles sont fabriquées dans le navigateur pendant la lecture (canvas
    et MediaRecorder) : aucun serveur vidéo ni outil à installer ; garder la page
    ouverte pendant l'enregistrement. MP4 sur Chrome (ordinateur et Android
    récents), sinon WebM. Les pochettes passent par `/studio/cover` (admins,
    images Deezer seulement). Code : `app/studio/StudioVideo.tsx`. Aucun SQL.
45. Flèche « descendre » dans les conversations (12 novembre 2026) : comme sur
    WhatsApp, une flèche ronde apparaît en bas à droite dès qu'on remonte dans les
    messages, et ramène au dernier message d'un toucher. Sur téléphone, l'arrivée
    dans une conversation, l'envoi et la réception d'un message descendent aussi
    jusqu'en bas de la zone des messages (avant, seule la page descendait).
    Code : `app/messages/[username]/ScrollDown.tsx` et `scroll.ts`. Aucun SQL.
46. Google, chargement et Deezer (12 novembre 2026) :
    - **Google** : `robots.txt` et plan du site `sitemap.xml` (pages principales,
      chaque album et titre noté, profils des vrais membres). Les pages album,
      titre et artiste ont une description (« noté 4,3/5 (12 notes) sur Pépite »)
      et des données structurées pour que Google puisse afficher les étoiles.
      Code : `app/robots.ts`, `app/sitemap.ts`, `lib/seo.tsx`.
    - **Écrans de chargement** sur les pages album, titre, artiste, profil,
      Classements et Explorer : des emplacements gris s'affichent tout de suite
      (`components/PageSkeleton.tsx`).
    - **Deezer** : chaque appel est coupé au bout de 5 secondes ; une réponse
      d'erreur de Deezer n'est plus gardée des heures (nouvel essai, gardé
      10 minutes). Code : `get` dans `lib/deezer.ts`. Aucun SQL.
44. Plus de pays (12 novembre 2026) : la liste des tops pays (Studio, Classements,
    tendances) n'avait plus qu'une dizaine de pays, mélangés avec des playlists
    « Top Hits 1985 », car la liste du compte Deezer Charts ne répondait plus.
    Elle est maintenant lue page par page, et chaque pays manquant (environ 80
    pays connus, dont la Côte d'Ivoire, le Sénégal, le Cameroun, le Nigeria, le
    Kenya…) est cherché un par un, seulement chez Deezer Charts. Gardé une
    journée. Code : `getCountryCharts` dans `lib/deezer.ts`. Aucun SQL.
    Correctif le même jour : la recherche pays par pays pouvait prendre plus de
    10 secondes et faire planter Classements et le Studio. Elle s'arrête
    maintenant au bout de 3 secondes (pays d'Afrique et France cherchés en
    premier), la liste est gardée en mémoire 6 heures et se complète d'une
    visite à l'autre.

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
| `08-grande-mise-a-jour.sql` | Premier pas, modification du profil, notifications téléphone, mentions, modération, erreurs | à vérifier |
| `09-corriger-demo.sql` | Retire « Démo » des vrais membres (sans risque, rejouable) | à vérifier |
| `10-lancement.sql` | Contact, suppression de compte, blocage, anti-spam, annonces | à vérifier |
| `11-invitations.sql` | Liens d'invitation (parrainage) | non (à faire) |
| `12-pseudos-modifiables.sql` | Changement de pseudo, anciennes adresses et mentions conservées | non (à faire) |
| Aucun (visuel) | Mise en page du profil et icônes | Aucun SQL à exécuter |
| Aucun (visuel) | Boutons de recommandation et de favoris | Aucun SQL à exécuter |
| Aucun (performance) | Chargement parallèle des pages album | Aucun SQL à exécuter |
| Aucun (interface mobile) | Conversation façon WhatsApp : en-tête, fil défilant et saisie au-dessus du clavier | Aucun SQL à exécuter |
| Aucun (interface mobile) | Réalignement de la barre du haut pour les visiteurs | Aucun SQL à exécuter |
| Aucun (interface mobile) | Icône de changement de thème près de la recherche | Aucun SQL à exécuter |
| `13-suppressions.sql` | Supprimer un message, une notification, vider une conversation | oui (confirmé avec le fichier 14) |
| `14-video-queue.sql` et `15-video-review.sql` | Anciens scripts vidéo ; retirés du dépôt, ne plus exécuter | retirés |
| Aucun (Studio) | Affiche Top 10 | Aucun SQL à exécuter |
| Aucun (Studio) | Vidéos « Ta note ? » et duel | Aucun SQL à exécuter |
| Aucun (interface) | Flèche « descendre » dans les conversations | Aucun SQL à exécuter |
| Aucun (Google, chargement, Deezer) | Plan du site, descriptions, écrans de chargement | Aucun SQL à exécuter |
| Aucun (Deezer) | Plus de pays dans les tops | Aucun SQL à exécuter |
| `16-retirer-videos.sql` | Supprimer les anciennes fonctions et tables vidéo (après avoir vidé le bucket dans Storage) | à exécuter |

La fonction multilingue (français, anglais et espagnol) ne modifie pas la base
Supabase : aucune requête SQL n’est à exécuter pour la langue. La détection par
pays utilise Vercel ; en développement local, le navigateur reste prioritaire
et l'espagnol se choisit dans les réglages.

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
- [ ] Exécuter `07-temps-reel.sql` (si ce n'est pas fait), puis `08-grande-mise-a-jour.sql` (nécessaire pour enregistrer les changements de profil)
- [ ] Ajouter les clés `NEXT_PUBLIC_VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY` dans Vercel, puis redéployer
- [ ] Se mettre administrateur (`is_admin` dans la table `profiles`)
- [ ] Exécuter `10-lancement.sql`, puis `11-invitations.sql`
- [ ] Exécuter `12-pseudos-modifiables.sql` après le fichier 11 (nécessaire pour changer de pseudo et garder les anciens liens)
- [x] `13-suppressions.sql` exécuté (confirmé par l'exécution du fichier 14)
- [ ] Compléter les traductions anglaise et espagnole des pages restantes (avis, albums, messages, notifications, modération et pages d'information)
- [x] Corriger la largeur de l'éditeur de profil sur téléphone et remplacer les icônes de recommandation et de l'année musicale
- [x] Aligner l'icône de recommandation à gauche et colorer les boutons ouverts/sélectionnés
- [x] Réduire l'attente sur les pages album en chargeant Deezer, avis et session en parallèle, sans modifier l'interface
- [x] Réduire les données chargées pour les classements de contributeurs, sans changer l'interface
- [x] Préparer la configuration Android pour le Play Store ; le propriétaire doit encore créer son compte Play Console, sa clé de signature et renseigner l'empreinte dans Vercel
- [x] Garder le nom de l'ami en haut, les messages défilants au milieu et la barre d'écriture au-dessus du clavier, comme WhatsApp
- [x] Garder le cadre fixe sur téléphone et réserver le défilement aux messages
- [x] Retirer les doublons Messages et Langue du menu du compte
- [x] Réaligner les commandes du haut sur téléphone pour éviter leur chevauchement
- [x] Masquer la rangée Paramètres / Langue / Thème du haut sur téléphone
- [x] Placer l'icône de thème à côté de la recherche sur téléphone
- [x] Retirer la fonction vidéo du site et préparer son nettoyage dans Supabase
- [ ] Si le bucket vidéo existe : supprimer d'abord les MP4 dans **Storage > weekly-videos**, puis exécuter `16-retirer-videos.sql` dans Supabase
- [x] E-mails envoyés par Brevo, modèles en français (vérifié le 1er novembre 2026)
- [ ] Ajouter `CRON_SECRET` et `SUPABASE_SERVICE_ROLE_KEY` dans Vercel (README)
- [ ] Faire relire les pages Confidentialité et Conditions par un juriste afin de vérifier les règles applicables aux pays visés
- [ ] Quand assez de vrais membres sont inscrits : exécuter `demo-supprimer.sql`
- [ ] Vérifier que le site en ligne sur Vercel marche avec la dernière version
- [ ] Vérifier que le Studio en ligne permet toujours de préparer et télécharger
      les carrousels d'albums, de titres et d'artistes
- [ ] Après publication, enregistrer une vidéo « Ta note ? » et une vidéo duel
      depuis le Studio (sur ordinateur avec Chrome, puis sur téléphone)
- [ ] Après publication, essayer l'affiche Top 10 du Studio (au moins un top
      de pays en titres, un en albums et un Top Monde en artistes)
- [ ] **Nom de domaine** (plus tard) : `.ci` (environ 45 000 à 75 000 FCFA/an,
  CNI demandée, 2 à 5 jours) ou `.com` (environ 10 à 15 $/an, immédiat, achat
  possible dans Vercel). Puis : Vercel > Settings > Domains ; Supabase > URL
  Configuration (Site URL + Redirect URLs) ; Brevo > Domaines (authentifier) et
  expéditeur `bonjour@…` ; renvoi des e-mails reçus avec ImprovMX.
- [ ] Inscrire le site dans **Google Search Console** (gratuit) et y envoyer le
      plan du site `/sitemap.xml`, pour que Google visite les pages plus vite
- [ ] (idées à ajouter ici)

## Idées mises de côté

- **Lecteur YouTube intégré** (écouter les titres en entier sur Pépite) : écarté
  le 1er novembre 2026. Gain faible (Pépite sert à noter, pas à écouter ; les
  extraits de 30 s et le bouton YouTube suffisent), coût réel (beaucoup de data
  en 4G, vidéo obligatoirement visible, pas d'écoute écran éteint, clé Google
  limitée à ~100 recherches par jour). À revoir seulement si les membres le
  demandent.

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
