import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AuthorLink from "@/components/AuthorLink";
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

        <ThreadView
          messages={messages}
          meId={me.id}
          friendId={friend.id}
          friendName={friend.display_name}
          friendUsername={friend.username}
          canWrite={friends}
        />
      </div>
    </>
  );
}
