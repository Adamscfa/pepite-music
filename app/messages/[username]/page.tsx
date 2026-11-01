import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AuthorLink from "@/components/AuthorLink";
import Cover from "@/components/Cover";
import MarkRead from "@/components/MarkRead";
import MessageTime from "@/components/MessageTime";
import ReadTicks from "@/components/ReadTicks";
import { markThreadRead } from "@/app/social-actions";
import { areFriends, getCurrentProfile, getProfileByUsername, getThread } from "@/lib/data";
import { emojiCount } from "@/lib/format";
import MessageForm from "./MessageForm";
import ThreadLive from "./ThreadLive";

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
      <ThreadLive
        friendId={friend.id}
        count={messages.length}
        lastFromFriend={messages.at(-1)?.sender_id === friend.id}
      />
      <div className="chat">
        <header className="chat-head">
          <Link href="/messages" className="chat-back" aria-label="Tous les messages">
            ←
          </Link>
          <AuthorLink user={friend} />
        </header>

        <div className="thread">
          {messages.length === 0 && <p className="small chat-empty">Pas encore de message. Dis bonjour !</p>}
          {messages.map((m) => {
            const mine = m.sender_id === me.id;
            // 1 à 3 emojis seuls : affichés en grand, sans bulle, comme sur WhatsApp.
            const emojis = m.album_id ? 0 : emojiCount(m.body);
            const size = emojis > 0 && emojis <= 3 ? " jumbo" : emojis > 0 ? " emojis" : "";
            return (
              <div key={m.id} className={`bubble${mine ? " mine" : ""}${size}`}>
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
                <small className="when">
                  <MessageTime iso={m.created_at} />
                  {mine && <ReadTicks read={Boolean(m.read_at)} />}
                </small>
              </div>
            );
          })}
        </div>

        {friends ? (
          <MessageForm to={friend.username} />
        ) : (
          <p className="empty">
            Vous n&apos;êtes pas encore amis. Abonne-toi à {friend.display_name} depuis son profil pour pouvoir lui
            écrire.
          </p>
        )}
      </div>
    </>
  );
}
