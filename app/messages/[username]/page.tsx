import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import MarkRead from "@/components/MarkRead";
import { markThreadRead } from "@/app/social-actions";
import { areFriends, getCurrentProfile, getProfileByUsername, getThread } from "@/lib/data";
import ThreadLive from "./ThreadLive";
import ThreadView from "./ThreadView";

export const metadata: Metadata = { title: "Messages" };

export default async function ThreadPage({ params }: PageProps<"/messages/[username]">) {
  const me = await getCurrentProfile();
  if (!me) redirect("/connexion");
  const friend = await getProfileByUsername(decodeURIComponent((await params).username));
  if (!friend || friend.id === me.id) notFound();
  const friends = await areFriends(me.id, friend.id);
  if (!friends) {
    return (
      <div className="box" style={{ maxWidth: 560, margin: "48px auto", textAlign: "center" }}>
        <h1 className="section-title">Conversation indisponible</h1>
        <p className="small">
          Pour vous écrire, vous devez vous suivre tous les deux. Abonne-toi à {friend.display_name} depuis son profil,
          et cette personne devra aussi s&apos;abonner à toi.
        </p>
        <Link href={`/profil/${friend.username}`} className="btn">
          Voir le profil
        </Link>
        <Link href="/messages" className="btn ghost" style={{ marginLeft: 8 }}>
          Retour aux messages
        </Link>
      </div>
    );
  }
  const messages = await getThread(me.id, friend.id);

  return (
    <>
      <MarkRead action={markThreadRead.bind(null, friend.id)} />
      <ThreadLive
        friendId={friend.id}
        count={messages.length}
        lastFromFriend={messages.at(-1)?.sender_id === friend.id}
      />
      <div className="chat">
        <ThreadView
          messages={messages}
          meId={me.id}
          friendId={friend.id}
          friend={friend}
          friendName={friend.display_name}
          friendUsername={friend.username}
          canWrite={friends}
        />
      </div>
    </>
  );
}
