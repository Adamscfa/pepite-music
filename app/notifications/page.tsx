import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/Avatar";
import MarkRead from "@/components/MarkRead";
import { markNotificationsRead } from "@/app/social-actions";
import { getCurrentProfile, getNotifications, type Notification } from "@/lib/data";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Notifications" };

function describe(n: Notification): { text: string; href: string } {
  const what = n.review ? `« ${n.review.track_title ?? n.review.album_title} »` : "ton avis";
  const review = n.review_id ? `/avis/${n.review_id}` : `/profil/${n.actor.username}`;
  switch (n.kind) {
    case "like":
      return { text: `a aimé ton avis sur ${what}`, href: review };
    case "comment":
      return { text: `a commenté ton avis sur ${what}`, href: review };
    case "reaction":
      return { text: `a réagi ${n.emoji ?? ""} à ton avis sur ${what}`, href: review };
    case "follow":
      return { text: "s'est abonné·e à toi", href: `/profil/${n.actor.username}` };
    case "recommend":
      return { text: "t'a recommandé un album", href: `/messages/${n.actor.username}` };
    case "message":
      return { text: "t'a envoyé un message", href: `/messages/${n.actor.username}` };
  }
}

export default async function NotificationsPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/connexion");
  const notifications = await getNotifications(me.id);

  return (
    <>
      <MarkRead action={markNotificationsRead} />
      <div className="eyebrow">Activité</div>
      <h1 style={{ fontSize: 30, marginBottom: 16 }}>Notifications</h1>
      {notifications.length ? (
        <div className="notifs">
          {notifications.map((n) => {
            const { text, href } = describe(n);
            return (
              <Link key={n.id} href={href} className={n.read_at ? "notif" : "notif unread"}>
                <Avatar user={n.actor} />
                <span>
                  <b>{n.actor.display_name}</b> {text}
                  <small>{timeAgo(n.created_at)}</small>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          Rien de neuf pour l&apos;instant. Quand quelqu&apos;un aimera ou commentera tes avis, ou s&apos;abonnera à
          toi, tu le verras ici.
        </div>
      )}
    </>
  );
}
