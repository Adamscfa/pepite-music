"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import Cover from "@/components/Cover";
import DemoBadge from "@/components/DemoBadge";
import ReadTicks from "@/components/ReadTicks";
import type { Author, Message } from "@/lib/data";
import { emojiCount } from "@/lib/format";
import { getBrowserClient } from "@/lib/supabase/browser";
import MessageForm from "./MessageForm";

const time = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// « Aujourd'hui », « Hier », ou la date, à l'heure de l'appareil.
function dayLabel(d: Date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(d) === dayKey(today)) return "Aujourd'hui";
  if (dayKey(d) === dayKey(yesterday)) return "Hier";
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(d.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  });
}

// La conversation : bulles par jour, « Vu à … », « en train d'écrire… » et la barre d'écriture.
export default function ThreadView({
  messages,
  meId,
  friendId,
  friend,
  friendName,
  friendUsername,
  canWrite,
}: {
  messages: Message[];
  meId: string;
  friendId: string;
  friend: Author;
  friendName: string;
  friendUsername: string;
  canWrite: boolean;
}) {
  const [typing, setTyping] = useState(false);
  // Les heures dépendent du fuseau de l'appareil : on les calcule une fois affiché chez la personne.
  const [ready, setReady] = useState(false);
  const channel = useRef<RealtimeChannel | null>(null);
  const lastSent = useRef(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, []);

  // Canal « en train d'écrire » partagé par les deux personnes de la conversation.
  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    let hide: ReturnType<typeof setTimeout> | undefined;
    const topic = `typing:${[meId, friendId].sort().join(":")}`;
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled || !data.session) return;
      await supabase.realtime.setAuth(data.session.access_token);
      if (cancelled) return;
      channel.current = supabase
        .channel(topic)
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          if (payload?.from !== friendId) return;
          setTyping(true);
          clearTimeout(hide);
          hide = setTimeout(() => setTyping(false), 3500);
        })
        .subscribe();
    });
    return () => {
      cancelled = true;
      clearTimeout(hide);
      if (channel.current) supabase.removeChannel(channel.current);
      channel.current = null;
    };
  }, [meId, friendId]);

  // Un nouveau message de l'ami efface son « en train d'écrire ».
  const last = messages.at(-1);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (last?.sender_id === friendId) setTyping(false);
  }, [last?.id, last?.sender_id, friendId]);

  // Prévient l'ami qu'on écrit (au plus une fois toutes les 2 secondes).
  const onTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSent.current < 2000 || !channel.current) return;
    lastSent.current = now;
    channel.current.send({ type: "broadcast", event: "typing", payload: { from: meId } });
  }, [meId]);

  // Mon dernier message lu : on affiche « Vu à … » dessous, comme sur WhatsApp.
  const lastMine = [...messages].reverse().find((m) => m.sender_id === meId);

  return (
    <>
      {/* En-tête collé en haut : retour, photo et nom de l'ami, « en train d'écrire… » */}
      <header className="chat-head">
        <Link href="/messages" className="chat-back" aria-label="Tous les messages">
          ←
        </Link>
        <Link href={`/profil/${friend.username}`} className="chat-who">
          <Avatar user={friend} />
          <span>
            <b>
              {friend.display_name} <DemoBadge show={friend.is_demo} />
            </b>
            <small className={typing ? "typing-label" : undefined}>
              {typing ? "en train d'écrire…" : `@${friend.username}`}
            </small>
          </span>
        </Link>
      </header>

      <div className="thread">
        {messages.length === 0 && <p className="small chat-empty">Pas encore de message. Dis bonjour !</p>}
        {messages.map((m, i) => {
          const mine = m.sender_id === meId;
          const date = new Date(m.created_at);
          const prev = messages[i - 1];
          const newDay = ready && (!prev || dayKey(new Date(prev.created_at)) !== dayKey(date));
          // 1 à 3 emojis seuls : affichés en grand, sans bulle.
          const emojis = m.album_id ? 0 : emojiCount(m.body);
          const size = emojis > 0 && emojis <= 3 ? " jumbo" : emojis > 0 ? " emojis" : "";
          return (
            <Fragment key={m.id}>
              {newDay && (
                <div className="day-sep">
                  <span>{dayLabel(date)}</span>
                </div>
              )}
              <div className={`bubble${mine ? " mine" : ""}${size}`}>
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
                  <time dateTime={m.created_at} suppressHydrationWarning>
                    {ready ? time(date) : ""}
                  </time>
                  {mine && <ReadTicks read={Boolean(m.read_at)} />}
                </small>
              </div>
              {ready && m.id === lastMine?.id && m.read_at && (
                <div className="seen">
                  Vu{" "}
                  {dayKey(new Date(m.read_at)) === dayKey(new Date())
                    ? `à ${time(new Date(m.read_at))}`
                    : `le ${new Date(m.read_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} à ${time(new Date(m.read_at))}`}
                </div>
              )}
            </Fragment>
          );
        })}
        {typing && (
          <div className="bubble typing" aria-live="polite">
            <span className="dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="sr-only">{friendName} est en train d&apos;écrire</span>
          </div>
        )}
      </div>

      {canWrite ? (
        <MessageForm to={friendUsername} onTyping={onTyping} />
      ) : (
        <p className="empty">
          Vous n&apos;êtes pas encore amis. Abonne-toi à {friendName} depuis son profil pour pouvoir lui écrire.
        </p>
      )}
    </>
  );
}
