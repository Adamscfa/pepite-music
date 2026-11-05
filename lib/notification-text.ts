import type { Notification } from "./data";

// Phrase et lien d'une notification (page Notifications et notifications du téléphone).
export function describe(n: Notification): { text: string; href: string } {
  const what = n.review ? `« ${n.review.track_title ?? n.review.album_title} »` : "ton avis";
  const review = n.review_id ? `/avis/${n.review_id}` : `/profil/${n.actor.username}`;
  switch (n.kind) {
    case "like":
      return { text: `a aimé ton avis sur ${what}`, href: review };
    case "comment":
      return { text: `a commenté ton avis sur ${what}`, href: review };
    case "reply":
      return { text: `a répondu à ton commentaire sur ${n.review ? what : "un avis"}`, href: `${review}#commentaires` };
    case "mention":
      return { text: `t'a mentionné·e dans un commentaire sur ${n.review ? what : "un avis"}`, href: `${review}#commentaires` };
    case "reaction":
      return { text: `a réagi ${n.emoji ?? ""} à ton avis sur ${what}`, href: review };
    case "invite":
      return { text: "a rejoint Pépite grâce à ton invitation 🎉", href: `/profil/${n.actor.username}` };
    case "follow":
      return { text: "s'est abonné·e à toi", href: `/profil/${n.actor.username}` };
    case "recommend":
      return { text: "t'a recommandé un album", href: `/messages/${n.actor.username}` };
    case "message":
      return { text: "t'a envoyé un message", href: `/messages/${n.actor.username}` };
  }
}
