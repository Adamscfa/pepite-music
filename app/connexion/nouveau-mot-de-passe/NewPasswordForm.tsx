"use client";

import { useActionState } from "react";
import { updatePassword, type AuthState } from "../actions";

export default function NewPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, {});
  return (
    <form action={action} className="box" style={{ marginTop: 16 }}>
      <label className="field">
        Nouveau mot de passe
        <input name="password" type="password" required minLength={6} autoComplete="new-password" />
      </label>
      <label className="field">
        Encore une fois
        <input name="confirm" type="password" required minLength={6} autoComplete="new-password" />
      </label>
      <button className="btn" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
      {state.error && <p className="error">{state.error}</p>}
    </form>
  );
}
