import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/Avatar";
import MarkRead from "@/components/MarkRead";
import { markNotificationsRead } from "@/app/social-actions";
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
