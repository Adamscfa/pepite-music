"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendMessage, type FormState } from "@/app/social-actions";

export default function MessageForm({ to }: { to: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendMessage, {});
  const form = useRef<HTMLFormElement>(null);

  // Après l'envoi, on vide la zone de texte et on descend au dernier message.
  useEffect(() => {
    if (!state.done) return;
    form.current?.reset();
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, [state]);

  return (
    <form action={action} ref={form} className="box message-form">
      <input type="hidden" name="to" value={to} />
      <textarea name="body" required maxLength={1000} placeholder="Ton message…" aria-label="Ton message" />
      <div className="row">
        <span className="small">Pour recommander un album, va sur sa page.</span>
        <button className="btn" disabled={pending}>
          {pending ? "Envoi…" : "Envoyer"}
        </button>
      </div>
      {state.error && <p className="error">{state.error}</p>}
    </form>
  );
}
