"use client";

import { useActionState } from "react";
import { deleteMessage, type FormState } from "@/app/social-actions";

export default function DeleteMessage({ messageId }: { messageId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteMessage, {});

  return (
    <form
      action={action}
      className="comment-pop"
      onSubmit={(event) => {
        const form = event.currentTarget;
        if (!form.hasAttribute("data-confirm")) {
          event.preventDefault();
          form.setAttribute("data-confirm", "1");
        }
      }}
    >
      <input type="hidden" name="message_id" value={messageId} />
      <button type="submit" disabled={pending}>
        {pending ? "Suppression…" : "Supprimer le message"}
      </button>
      <small className="confirm-hint">Il part aussi chez ton ami. Cliquer encore.</small>
      {state.error && <p className="error">{state.error}</p>}
      {state.done && <p className="success">Message supprimé.</p>}
    </form>
  );
}
