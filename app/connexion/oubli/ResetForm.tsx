"use client";

import { useActionState } from "react";
import { requestPasswordReset, type AuthState } from "../actions";

export default function ResetForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  return (
    <form action={action} className="box" style={{ marginTop: 16 }}>
      <label className="field">
        E-mail
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <button className="btn" disabled={pending}>
        {pending ? "Envoi…" : "Recevoir le lien"}
      </button>
      {state.error && <p className="error">{state.error}</p>}
      {state.message && <p className="success">{state.message}</p>}
    </form>
  );
}
