"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { toggleLike } from "@/app/social-actions";
import Icon from "./Icon";

// Le cœur change tout de suite, la base suit en arrière-plan.
export default function LikeButton({
  reviewId,
  likes,
  liked,
  canLike,
}: {
  reviewId: number;
  likes: number;
  liked: boolean;
  canLike: boolean;
}) {
  const [state, setState] = useOptimistic({ likes, liked });
  const [, startTransition] = useTransition();

  if (!canLike) {
    return (
      <Link href="/connexion" className="action" title="Connecte-toi pour aimer">
        <Icon name="thumb" size={20} /> {likes}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className="action like-action"
      aria-pressed={state.liked}
      aria-label={state.liked ? "Je n'aime plus" : "J'aime"}
      onClick={() =>
        startTransition(async () => {
          const next = !state.liked;
          setState({ liked: next, likes: state.likes + (next ? 1 : -1) });
          await toggleLike(reviewId, next);
        })
      }
    >
      <Icon name="thumb" size={20} filled={state.liked} /> {state.likes}
    </button>
  );
}
