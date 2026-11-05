# Préparer l'application Android Pépite

Le projet Android utilise une **Trusted Web Activity** : l'application ouvre le
site Pépite dans Chrome, sans barre de navigateur lorsque le domaine est
vérifié. Le site et son aperçu restent inchangés.

## Ce qui est déjà préparé

- Identifiant proposé : `com.adamscfa.pepite` (il ne pourra plus être modifié
  après la première publication).
- Icônes, adresse du site et couleurs reprises du site installé.
- Adresse de vérification Android : `/.well-known/assetlinks.json`. Elle sera
  activée après configuration de l'empreinte de signature Play.

## Ce qu'Adams doit faire lui-même

1. Créer et vérifier son compte développeur sur
   [Google Play Console](https://play.google.com/console/). Google demande des
   renseignements personnels ou d'entreprise et des frais d'inscription.
2. Créer une application, en gardant l'identifiant `com.adamscfa.pepite`,
   puis activer **Play App Signing**. Conserver soigneusement le fichier de clé
   d'envoi et ses mots de passe : ils ne doivent jamais être envoyés sur GitHub.
3. Récupérer l'empreinte **SHA-256 du certificat de clé de signature de
   l'application** dans Play Console, puis l'ajouter dans Vercel :
   **Settings > Environment Variables**, nom
   `ANDROID_APP_SHA256_CERT_FINGERPRINTS`, valeur de l'empreinte copiée.
   Pour plusieurs certificats, les séparer par des virgules. Redéployer le
   site ; l'adresse `https://pepite-music.vercel.app/.well-known/assetlinks.json`
   doit alors renvoyer le lien Android.

## Générer l'application à envoyer à Google

Installer Java 17 ou plus récent. Bubblewrap peut installer les outils Android
nécessaires. Depuis le dossier du dépôt :

```bash
npx --yes @bubblewrap/cli update --manifest=android
keytool -genkeypair -v -keystore android/android.keystore -alias android -keyalg RSA -keysize 2048 -validity 10000
npx --yes @bubblewrap/cli build --manifest=android
```

La commande `keytool` demande un mot de passe et des informations pour créer la
clé d'envoi. Garder cette clé et son mot de passe dans un endroit sûr. Bubblewrap
produit un fichier `.aab` à importer dans Play Console. Il faudra ensuite
compléter la fiche du Play Store (description, captures d'écran, classification
et informations de confidentialité), effectuer le test demandé par Google et
soumettre l'application à validation.

La publication finale n'est pas automatique : seul le titulaire du compte Play
Console peut accepter les accords, confirmer son identité, payer les frais et
envoyer l'application pour examen.
