import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/Avatar";
import { getConversations, getCurrentProfile, getFriends } from "@/lib/data";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/connexion");
  const [conversations, friends] = await Promise.all([getConversations(me.id), getFriends(me.id)]);
  const talking = new Set(conversations.map((c) => c.friend.id));
  const others = friends.filter((f) => !talking.has(f.id));

  return (
    <>
      <div className="eyebrow">Entre amis</div>
      <h1 style={{ fontSize: 30, marginBottom: 6 }}>Messages</h1>
      <p className="small" style={{ marginTop: 0, marginBottom: 18 }}>
        Tu peux écrire à un membre quand l&apos;un de vous deux est abonné à l&apos;autre.
      </p>

      {conversations.length > 0 && (
        <div className="notifs">
          {conversations.map((c) => (
            <Link
              key={c.friend.id}
              href={`/messages/${c.friend.username}`}
              className={c.unread ? "notif unread" : "notif"}
            >
              <Avatar user={c.friend} />
              <span>
                <b>{c.friend.display_name}</b>
                {c.unread > 0 && <i className="dot inline">{c.unread}</i>}
                <small>
                  {c.last.sender_id === me.id ? "Toi : " : ""}
                  {c.last.album_title ? `💿 ${c.last.album_title}` : c.last.body.slice(0, 80)} ·{" "}
                  {timeAgo(c.last.created_at)}
                </small>
              </span>
            </Link>
          ))}
        </div>
      )}

      <section style={{ marginTop: 28 }}>
        <h2 className="section-title">{conversations.length ? "Écrire à un autre ami" : "Écrire à un ami"}</h2>
        {others.length ? (
          <div className="friends">
            {others.map((f) => (
              <Link key={f.id} href={`/messages/${f.username}`} className="friend">
                <Avatar user={f} />
                <span>{f.display_name}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="small">
            {friends.length
              ? "Tu as déjà une conversation avec tous tes amis."
              : "Pas encore d'amis. Abonne-toi à des membres depuis leur profil !"}
          </p>
        )}
      </section>
    </>
  );
}
