"use client";

import { useActionState, useEffect, useRef } from "react";
import { addComment, type FormState } from "@/app/social-actions";
import type { Author } from "@/lib/data";
import Avatar from "./Avatar";
import Icon from "./Icon";

// Champ « Écrire un commentaire… » avec le bouton d'envoi, pour un avis ou en réponse à un commentaire.
export default function CommentForm({
  reviewId,
  parentId,
  me,
  placeholder = "Écrire un commentaire…",
  autoFocus = false,
  onDone,
}: {
  reviewId: number;
  parentId?: number;
  me?: Author | null;
  placeholder?: string;
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(addComment, {});
  const form = useRef<HTMLFormElement>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  // On vide le champ une fois le commentaire envoyé.
  useEffect(() => {
    if (state.done) {
      form.current?.reset();
      done.current?.();
    }
  }, [state]);

  return (
    <form action={action} ref={form} className="comment-form">
      {me && <Avatar user={me} />}
      <input type="hidden" name="review_id" value={reviewId} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <div className="comment-field">
        <input
          name="body"
          required
          maxLength={500}
          placeholder={placeholder}
          aria-label={parentId ? "Ta réponse" : "Ton commentaire"}
          autoComplete="off"
          autoFocus={autoFocus}
        />
        <button className="send" disabled={pending} aria-label="Envoyer">
          <Icon name="send" size={18} />
        </button>
      </div>
      {state.error && <p className="error">{state.error}</p>}
    </form>
  );
}
