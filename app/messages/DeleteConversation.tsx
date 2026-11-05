"use client";

import { useActionState, useRef, useState } from "react";
import { deleteConversation, type FormState } from "@/app/social-actions";

// Bouton corbeille : un premier clic demande de confirmer, car la conversation
// disparaît pour les deux personnes.
export default function DeleteConversation({ friendId, friendName }: { friendId: string; friendName: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteConversation, {});
  const [asking, setAsking] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  return (
    <form action={action} ref={form} className="conv-del">
      <input type="hidden" name="friend_id" value={friendId} />
      <button
        type="button"
        disabled={pending}
        className={asking ? "confirm" : undefined}
        aria-label={
          asking
            ? `Confirmer : supprimer toute la conversation avec ${friendName}`
            : `Supprimer la conversation avec ${friendName}`
        }
        title={`Supprimer la conversation avec ${friendName} (pour vous deux)`}
        onClick={() => {
          if (asking) form.current?.requestSubmit();
          else setAsking(true);
        }}
      >
        {asking ? "⚠ Confirmer ?" : "🗑"}
      </button>
      {state.error && <p className="error">{state.error}</p>}
    </form>
  );
}
