# E-mails de Pépite (en français)

Supabase envoie les e-mails d'inscription, de mot de passe oublié, etc.
Ces fichiers sont leurs modèles en français, aux couleurs de Pépite.

## Où les coller

Supabase > **Authentication** > **Emails** > onglet **Templates**. Pour chaque modèle :
remplace le **Subject** (objet) et le **Body** (contenu, en mode « Source ») puis **Save**.

| Modèle Supabase | Objet à mettre | Fichier à coller |
| --- | --- | --- |
| Confirm signup | Active ton compte Pépite | `1-confirmer-inscription.html` |
| Reset password | Ton nouveau mot de passe Pépite | `2-mot-de-passe-oublie.html` |
| Magic link | Ton lien de connexion à Pépite | `3-lien-de-connexion.html` |
| Change email address | Confirme ta nouvelle adresse | `4-changer-adresse.html` |

Ne change pas `{{ .ConfirmationURL }}` : Supabase le remplace par le vrai lien.
