"use client";

import { useActionState } from "react";
import { reportReview, type FormState } from "@/app/social-actions";

// Petit menu « Signaler » : on choisit une raison, puis on envoie.
export default function ReportButton({ reviewId }: { reviewId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(reportReview, {});
  if (state.done) return <span className="small">Merci, c&apos;est signalé.</span>;
  return (
    <details className="report">
      <summary className="like">⚑ Signaler</summary>
      <form action={action} className="report-box">
        <input type="hidden" name="review_id" value={reviewId} />
        <select name="reason" className="select" aria-label="Raison du signalement" defaultValue="mechant">
          <option value="mechant">Message méchant</option>
          <option value="spam">Spam ou pub</option>
          <option value="hors-sujet">Hors sujet</option>
          <option value="autre">Autre</option>
        </select>
        <button className="btn ghost" disabled={pending}>
          Envoyer
        </button>
        {state.error && <p className="error">{state.error}</p>}
      </form>
    </details>
  );
}
