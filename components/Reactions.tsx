"use client";

import { useOptimistic, useTransition } from "react";
import { toggleReaction } from "@/app/social-actions";
import type { Reaction } from "@/lib/data";

// 🔥 😂 😢 💎 : celles déjà utilisées sont en couleur, les autres restent pâles.
export default function Reactions({
  reviewId,
  reactions,
  canReact,
}: {
  reviewId: number;
  reactions: Reaction[];
  canReact: boolean;
}) {
  const [state, setState] = useOptimistic(reactions);
  const [, startTransition] = useTransition();

  return (
    <span className="reactions">
      {state.map((r) => (
        <button
          key={r.emoji}
          type="button"
          className={r.count ? "reaction used" : "reaction"}
          aria-pressed={r.mine}
          disabled={!canReact}
          aria-label={`Réagir ${r.emoji}`}
          title={canReact ? undefined : "Connecte-toi pour réagir"}
          onClick={() =>
            startTransition(async () => {
              const on = !r.mine;
              setState(
                state.map((x) => (x.emoji === r.emoji ? { ...x, mine: on, count: x.count + (on ? 1 : -1) } : x)),
              );
              await toggleReaction(reviewId, r.emoji, on);
            })
          }
        >
          {r.emoji}
          {r.count > 0 && <span>{r.count}</span>}
        </button>
      ))}
    </span>
  );
}
