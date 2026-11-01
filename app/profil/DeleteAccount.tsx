"use client";

import { useActionState } from "react";
import { deleteAccount, type ProfileState } from "./actions";

// Zone « Supprimer mon compte », repliée par défaut.
export default function DeleteAccount({ username }: { username: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(deleteAccount, {});
  return (
    <details className="edit danger-zone">
      <summary>Supprimer mon compte</summary>
      <form action={action} className="box" style={{ marginTop: 10 }}>
        <p className="small" style={{ marginTop: 0 }}>
          Ton compte, tes avis, commentaires, messages, listes et photos seront effacés pour de bon. Ça ne peut pas être
          annulé.
        </p>
        <label className="field">
          Pour confirmer, tape ton pseudo : <b>{username}</b>
          <input name="confirm" required autoComplete="off" autoCapitalize="none" />
        </label>
        <button className="btn danger-btn" disabled={pending}>
          {pending ? "Suppression…" : "Supprimer définitivement"}
        </button>
        {state.error && <p className="error">{state.error}</p>}
      </form>
    </details>
  );
}
