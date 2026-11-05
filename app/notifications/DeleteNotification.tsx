"use client";

import { useActionState } from "react";
import { deleteNotification, type FormState } from "@/app/social-actions";

export default function DeleteNotification({ notificationId }: { notificationId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteNotification, {});

  return (
    <form action={action} className="notif-del">
      <input type="hidden" name="notification_id" value={notificationId} />
      <button type="submit" disabled={pending} aria-label="Supprimer cette notification" title="Supprimer">
        {pending ? "…" : "✕"}
      </button>
      {state.error && <small className="error">{state.error}</small>}
    </form>
  );
}
