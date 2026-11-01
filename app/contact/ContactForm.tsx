"use client";

import { useActionState } from "react";
import { sendContact, type ContactState } from "./actions";

export default function ContactForm({ loggedIn, topic }: { loggedIn: boolean; topic?: string }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, {});
  if (state.done) {
    return (
      <div className="box" style={{ marginTop: 16 }}>
        <p className="success" style={{ margin: 0 }}>
          Merci, ton message est bien arrivé ! On te répond dès que possible.
        </p>
      </div>
    );
  }
  return (
    <form action={action} className="box" style={{ marginTop: 16 }}>
      <label className="field">
        Sujet
        <select name="topic" className="select" defaultValue={topic ?? "question"}>
          <option value="question">Une question</option>
          <option value="bug">Quelque chose ne marche pas</option>
          <option value="donnees">Mes données (copie, correction…)</option>
          <option value="signalement">Signaler un membre ou un contenu</option>
          <option value="autre">Autre chose</option>
        </select>
      </label>
      {!loggedIn && (
        <>
          <label className="field">
            Ton nom
            <input name="name" maxLength={80} autoComplete="name" />
          </label>
          <label className="field">
            Ton e-mail (pour te répondre)
            <input name="email" type="email" required maxLength={200} autoComplete="email" />
          </label>
        </>
      )}
      {loggedIn && (
        <label className="field">
          E-mail pour te répondre (facultatif)
          <input name="email" type="email" maxLength={200} autoComplete="email" />
          <small className="small">Sinon, on te répond par message privé si besoin.</small>
        </label>
      )}
      <label className="field">
        Ton message
        <textarea name="body" required maxLength={3000} rows={6} />
      </label>
      {/* Piège à robots : invisible pour les humains */}
      <input type="text" name="site" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />
      <button className="btn" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer"}
      </button>
      {state.error && <p className="error">{state.error}</p>}
    </form>
  );
}
