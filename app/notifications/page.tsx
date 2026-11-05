import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/Avatar";
import MarkRead from "@/components/MarkRead";
import { deleteNotification, markNotificationsRead } from "@/app/social-actions";
import { getCurrentProfile, getNotifications } from "@/lib/data";
import { describe } from "@/lib/notification-text";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Notifications" };

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
              <div key={n.id} className={n.read_at ? "notif" : "notif unread"}>
                <Avatar user={n.actor} />
                <Link href={href} className="notif-main">
                  <span>
                    <b>{n.actor.display_name}</b> {text}
                    <small>{timeAgo(n.created_at)}</small>
                  </span>
                </Link>
                <form action={deleteNotification} className="notif-del">
                  <input type="hidden" name="notification_id" value={n.id} />
                  <button type="submit" aria-label="Supprimer cette notification" title="Supprimer">
                    ✕
                  </button>
                </form>
              </div>
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
