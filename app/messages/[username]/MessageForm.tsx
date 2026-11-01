"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendMessage, type FormState } from "@/app/social-actions";
import Icon from "@/components/Icon";

// Barre d'écriture collée en bas de l'écran, comme dans WhatsApp.
// Entrée envoie le message, Maj + Entrée passe à la ligne.
export default function MessageForm({ to }: { to: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendMessage, {});
  const form = useRef<HTMLFormElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  // La zone de texte grandit avec le message (jusqu'à quelques lignes).
  const grow = () => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  // Après l'envoi : on vide, on garde le curseur dans le champ et on descend au dernier message.
  useEffect(() => {
    if (!state.done) return;
    form.current?.reset();
    grow();
    field.current?.focus();
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, [state]);

  return (
    <form action={action} ref={form} className="composer">
      {state.error && <p className="error">{state.error}</p>}
      <input type="hidden" name="to" value={to} />
      <textarea
        ref={field}
        name="body"
        required
        rows={1}
        maxLength={1000}
        placeholder="Écris un message"
        aria-label="Ton message"
        onInput={grow}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (field.current?.value.trim()) form.current?.requestSubmit();
          }
        }}
      />
      <button className="send round" disabled={pending} aria-label="Envoyer">
        <Icon name="send" size={20} />
      </button>
    </form>
  );
}
