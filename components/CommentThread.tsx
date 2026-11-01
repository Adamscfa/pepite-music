"use client";

import Link from "next/link";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { deleteComment, toggleCommentLike } from "@/app/social-actions";
import type { Author, Comment } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import Avatar from "./Avatar";
import CommentForm from "./CommentForm";
import DemoBadge from "./DemoBadge";
import Icon from "./Icon";

type Sort = "top" | "recent" | "old";
const SORTS: { id: Sort; label: string }[] = [
  { id: "top", label: "Top" },
  { id: "recent", label: "Plus récents" },
  { id: "old", label: "Plus anciens" },
];

// Au-delà de ce niveau, les réponses ne sont plus décalées vers la droite (lisible sur téléphone).
const MAX_INDENT = 3;

type Ctx = {
  reviewId: number;
  me: Author | null;
  meId: string | null;
  childrenOf: Map<number, Comment[]>;
  replying: number | null;
  setReplying: (id: number | null) => void;
};

// Tous les commentaires d'un avis, avec les réponses rangées sous le commentaire auquel elles répondent.
export default function CommentThread({
  reviewId,
  comments,
  me,
  meId,
}: {
  reviewId: number;
  comments: Comment[];
  me: Author | null;
  meId: string | null;
}) {
  const [sort, setSort] = useState<Sort>("top");
  const [replying, setReplying] = useState<number | null>(null);

  const { roots, childrenOf } = useMemo(() => {
    const ids = new Set(comments.map((c) => c.id));
    const childrenOf = new Map<number, Comment[]>();
    const roots: Comment[] = [];
    for (const c of comments) {
      if (c.parent_id && ids.has(c.parent_id)) {
        childrenOf.set(c.parent_id, [...(childrenOf.get(c.parent_id) ?? []), c]);
      } else roots.push(c);
    }
    return { roots, childrenOf };
  }, [comments]);

  const sorted = useMemo(() => {
    const byDate = (a: Comment, b: Comment) => a.created_at.localeCompare(b.created_at);
    const list = [...roots];
    if (sort === "old") return list.sort(byDate);
    if (sort === "recent") return list.sort((a, b) => byDate(b, a));
    // « Top » : les plus aimés, puis ceux qui ont le plus de réponses.
    return list.sort(
      (a, b) =>
        b.likes - a.likes ||
        (childrenOf.get(b.id)?.length ?? 0) - (childrenOf.get(a.id)?.length ?? 0) ||
        byDate(b, a),
    );
  }, [roots, sort, childrenOf]);

  const ctx: Ctx = { reviewId, me, meId, childrenOf, replying, setReplying };

  return (
    <section className="thread-box" id="commentaires">
      <h2 className="thread-title">
        <Icon name="comment" size={22} filled /> Commentaires ({comments.length})
      </h2>

      <div className="thread-new">
        {me ? (
          <CommentForm reviewId={reviewId} me={me} placeholder="Ajouter un commentaire…" />
        ) : (
          <p className="small">
            <Link href="/connexion" className="link-btn">
              Connecte-toi
            </Link>{" "}
            pour commenter et répondre.
          </p>
        )}
      </div>

      {comments.length > 0 ? (
        <>
          <div className="sort-chips" role="group" aria-label="Trier les commentaires">
            {SORTS.map((s) => (
              <button key={s.id} type="button" aria-pressed={sort === s.id} onClick={() => setSort(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          <ul className="comments">
            {sorted.map((c) => (
              <CommentItem key={c.id} comment={c} depth={0} ctx={ctx} />
            ))}
          </ul>
        </>
      ) : (
        <p className="thread-empty">Personne n&apos;a encore commenté. Lance la discussion !</p>
      )}
    </section>
  );
}

function CommentItem({ comment: c, depth, ctx }: { comment: Comment; depth: number; ctx: Ctx }) {
  const replies = ctx.childrenOf.get(c.id) ?? [];
  // Peu de réponses : on les montre ; beaucoup : on les replie.
  const [open, setOpen] = useState(replies.length <= 2);
  const total = countAll(c.id, ctx.childrenOf);

  return (
    <li className="comment" id={`c-${c.id}`}>
      <Link href={`/profil/${c.profile.username}`} className="comment-avatar" aria-label={c.profile.display_name}>
        <Avatar user={c.profile} />
      </Link>
      <div className="comment-main">
        <div className="comment-head">
          <Link href={`/profil/${c.profile.username}`} className="link-under">
            <b>{c.profile.display_name}</b>
          </Link>
          <DemoBadge show={c.profile.is_demo} />
          <span>{timeAgo(c.created_at)}</span>
        </div>
        <p className="comment-body">{c.body}</p>
        <div className="comment-actions">
          <CommentLike comment={c} canLike={Boolean(ctx.me)} />
          {ctx.me && (
            <button
              type="button"
              className="text-btn"
              aria-expanded={ctx.replying === c.id}
              onClick={() => ctx.setReplying(ctx.replying === c.id ? null : c.id)}
            >
              Répondre
            </button>
          )}
          {ctx.meId === c.user_id && (
            <details className="comment-more">
              <summary aria-label="Plus d'actions">
                <Icon name="dots" size={18} />
              </summary>
              <form action={deleteComment} className="comment-pop">
                <input type="hidden" name="comment_id" value={c.id} />
                <button type="submit">Supprimer le commentaire</button>
              </form>
            </details>
          )}
        </div>

        {ctx.replying === c.id && (
          <div className="reply-form">
            <CommentForm
              reviewId={ctx.reviewId}
              parentId={c.id}
              me={ctx.me}
              placeholder={`Répondre à ${c.profile.display_name}…`}
              autoFocus
              onDone={() => {
                ctx.setReplying(null);
                setOpen(true);
              }}
            />
          </div>
        )}

        {replies.length > 0 && (
          <>
            <button type="button" className="toggle-replies" aria-expanded={open} onClick={() => setOpen(!open)}>
              <Icon name="chevron" size={16} />
              {open ? "Masquer les réponses" : `Voir ${total} réponse${total > 1 ? "s" : ""}`}
            </button>
            {open && (
              <ul className={depth + 1 < MAX_INDENT ? "comments replies" : "comments replies flat"}>
                {replies.map((r) => (
                  <CommentItem key={r.id} comment={r} depth={depth + 1} ctx={ctx} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </li>
  );
}

// Nombre de réponses sous un commentaire, à tous les niveaux.
function countAll(id: number, childrenOf: Map<number, Comment[]>): number {
  return (childrenOf.get(id) ?? []).reduce((n, r) => n + 1 + countAll(r.id, childrenOf), 0);
}

function CommentLike({ comment, canLike }: { comment: Comment; canLike: boolean }) {
  const [state, setState] = useOptimistic({ likes: comment.likes, liked: comment.liked });
  const [, startTransition] = useTransition();
  if (!canLike) {
    return (
      <Link href="/connexion" className="heart-btn" title="Connecte-toi pour aimer">
        <Icon name="heart" size={17} filled /> {state.likes}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className="heart-btn"
      aria-pressed={state.liked}
      aria-label={state.liked ? "Je n'aime plus ce commentaire" : "J'aime ce commentaire"}
      onClick={() =>
        startTransition(async () => {
          const next = !state.liked;
          setState({ liked: next, likes: state.likes + (next ? 1 : -1) });
          await toggleCommentLike(comment.id, next);
        })
      }
    >
      <Icon name="heart" size={17} filled /> {state.likes}
    </button>
  );
}
