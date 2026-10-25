"use client";

import { useActionState, useEffect, useRef } from "react";
import { addComment, type FormState } from "@/app/social-actions";

export default function CommentForm({ reviewId }: { reviewId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addComment, {});
  const form = useRef<HTMLFormElement>(null);

  // On vide le champ une fois le commentaire envoyé.
  useEffect(() => {
    if (state.done) form.current?.reset();
  }, [state]);

  return (
    <form action={action} ref={form} className="box" style={{ marginTop: 14 }}>
      <input type="hidden" name="review_id" value={reviewId} />
      <textarea name="body" required maxLength={500} rows={3} placeholder="Ajoute un commentaire…" aria-label="Ton commentaire" />
      <div className="row">
        <span className="small">500 caractères max.</span>
        <button className="btn" disabled={pending}>
          {pending ? "Envoi…" : "Commenter"}
        </button>
      </div>
      {state.error && <p className="error">{state.error}</p>}
    </form>
  );
}
