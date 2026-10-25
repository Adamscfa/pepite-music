import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AuthorLink from "@/components/AuthorLink";
import Cover from "@/components/Cover";
import MarkRead from "@/components/MarkRead";
import { markThreadRead } from "@/app/social-actions";
import { areFriends, getCurrentProfile, getProfileByUsername, getThread } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import MessageForm from "./MessageForm";

export const metadata: Metadata = { title: "Messages" };

export default async function ThreadPage({ params }: PageProps<"/messages/[username]">) {
  const me = await getCurrentProfile();
  if (!me) redirect("/connexion");
  const friend = await getProfileByUsername(decodeURIComponent((await params).username));
  if (!friend || friend.id === me.id) notFound();
  const [messages, friends] = await Promise.all([getThread(me.id, friend.id), areFriends(me.id, friend.id)]);

  return (
    <>
      <MarkRead action={markThreadRead.bind(null, friend.id)} />
      <Link href="/messages" className="small link-under">
        ← Tous les messages
      </Link>
      <div className="thread-head">
        <AuthorLink user={friend} />
      </div>

      <div className="thread">
        {messages.length === 0 && <p className="small">Pas encore de message. Dis bonjour !</p>}
        {messages.map((m) => (
          <div key={m.id} className={m.sender_id === me.id ? "bubble mine" : "bubble"}>
            {m.album_id && (
              <Link href={`/album/${m.album_id}`} className="bubble-album">
                <Cover src={m.cover_url} size="s" />
                <span>
                  <small>💿 Album recommandé</small>
                  <b>{m.album_title}</b>
                  <small>{m.artist_name}</small>
                </span>
              </Link>
            )}
            {m.body && <p>{m.body}</p>}
            <small className="when">{timeAgo(m.created_at)}</small>
          </div>
        ))}
      </div>

      {friends ? (
        <MessageForm to={friend.username} />
      ) : (
        <p className="empty">
          Vous n&apos;êtes pas encore amis. Abonne-toi à {friend.display_name} depuis son profil pour pouvoir lui
          écrire.
        </p>
      )}
    </>
  );
}
