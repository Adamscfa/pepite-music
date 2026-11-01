"use client";

import { useEffect, useRef } from "react";
import { markThreadRead } from "@/app/social-actions";

// Dans une conversation ouverte : quand un nouveau message arrive, on descend jusqu'à lui
// et on le marque comme lu (puisqu'on est en train de le lire).
export default function ThreadLive({ friendId, count, lastFromFriend }: { friendId: string; count: number; lastFromFriend: boolean }) {
  const seen = useRef(count);

  useEffect(() => {
    if (count === seen.current) return;
    seen.current = count;
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    if (lastFromFriend) markThreadRead(friendId);
  }, [count, lastFromFriend, friendId]);

  return null;
}
