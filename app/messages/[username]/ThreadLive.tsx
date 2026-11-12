"use client";

import { useEffect, useRef } from "react";
import { markThreadRead } from "@/app/social-actions";
import { scrollChatToBottom } from "./scroll";

// Dans une conversation ouverte : quand un nouveau message arrive, on descend jusqu'à lui
// et on le marque comme lu (puisqu'on est en train de le lire).
export default function ThreadLive({ friendId, count, lastFromFriend }: { friendId: string; count: number; lastFromFriend: boolean }) {
  const seen = useRef(count);

  // À l'ouverture, on arrive directement sur les derniers messages.
  useEffect(() => {
    scrollChatToBottom();
  }, []);

  useEffect(() => {
    if (count === seen.current) return;
    seen.current = count;
    scrollChatToBottom(true);
    if (lastFromFriend) markThreadRead(friendId);
  }, [count, lastFromFriend, friendId]);

  return null;
}
