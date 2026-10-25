"use client";

import { useActionState, useRef, useState } from "react";
import { deleteReview, saveReview, type ReviewState } from "./actions";

export default function RatingForm({
  albumId,
  trackId,
  initialRating,
  initialBody,
}: {
  albumId: number;
  trackId?: number;
  initialRating: number;
  initialBody: string;
}) {
  const [rating, setRating] = useState(initialRating);
  const [state, action, pending] = useActionState<ReviewState, FormData>(saveReview, {});
  // Vrai juste après « Supprimer ma note » : on vide le formulaire et on cache le message.
  const [deleted, setDeleted] = useState(false);
  const text = useRef<HTMLTextAreaElement>(null);
  const editing = initialRating > 0;

  return (
    <div className="box rate">
      <h2>Ta note</h2>
      <form action={action} onSubmit={() => setDeleted(false)}>
        <input type="hidden" name="album_id" value={albumId} />
        <input type="hidden" name="track_id" value={trackId ?? ""} />
        <input type="hidden" name="rating" value={rating} />
        <div className="picker" role="radiogroup" aria-label="Ta note">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
              className={n <= rating ? "on" : undefined}
              onClick={() => setRating(n)}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          ref={text}
          name="body"
          defaultValue={initialBody}
          maxLength={2000}
          placeholder={trackId ? "Qu'as-tu pensé de ce titre ?" : "Qu'as-tu pensé de cet album ?"}
          aria-label="Ton avis"
        />
        <div className="row">
          <span className="small">Ton avis apparaîtra dans le fil.</span>
          <button className="btn" disabled={!rating || pending}>
            {pending ? "Envoi…" : editing ? "Mettre à jour" : "Publier"}
          </button>
        </div>
        {state.error && <p className="error">{state.error}</p>}
        {state.saved && !pending && !deleted && <p className="success">Avis publié dans le fil.</p>}
      </form>
      {editing && (
        <form
          action={async (formData) => {
            await deleteReview(formData);
            setRating(0);
            setDeleted(true);
            if (text.current) text.current.value = "";
          }}
          style={{ marginTop: 10 }}
        >
          <input type="hidden" name="album_id" value={albumId} />
          <input type="hidden" name="track_id" value={trackId ?? ""} />
          <button className="btn ghost">Supprimer ma note</button>
        </form>
      )}
    </div>
  );
}
