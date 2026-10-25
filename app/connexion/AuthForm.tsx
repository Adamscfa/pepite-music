"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

export default function AuthForm({ linkError }: { linkError: boolean }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [inState, inAction, inPending] = useActionState<AuthState, FormData>(signIn, {});
  const [upState, upAction, upPending] = useActionState<AuthState, FormData>(signUp, {});

  return (
    <div className="auth">
      <div className="eyebrow">Bienvenue</div>
      <h1>{mode === "in" ? "Connexion" : "Créer un compte"}</h1>
      <p className="small">Note tes albums, écris tes avis et suis ce que la communauté écoute.</p>

      <div className="tabs">
        <button type="button" aria-pressed={mode === "in"} onClick={() => setMode("in")}>
          J&apos;ai un compte
        </button>
        <button type="button" aria-pressed={mode === "up"} onClick={() => setMode("up")}>
          Je m&apos;inscris
        </button>
      </div>

      {linkError && <p className="error">Ce lien de confirmation ne marche plus. Connecte-toi ou réinscris-toi.</p>}

      {mode === "in" ? (
        <form action={inAction} className="box">
          <label className="field">
            E-mail
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className="field">
            Mot de passe
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          <button className="btn" disabled={inPending}>
            {inPending ? "Connexion…" : "Se connecter"}
          </button>
          {inState.error && <p className="error">{inState.error}</p>}
        </form>
      ) : (
        <form action={upAction} className="box">
          <label className="field">
            Pseudo
            <input name="username" required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_.]+" autoComplete="username" />
            <small className="small">Il apparaîtra dans l&apos;adresse de ton profil.</small>
          </label>
          <label className="field">
            Nom affiché
            <input name="display_name" maxLength={40} placeholder="Facultatif" />
          </label>
          <label className="field">
            E-mail
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className="field">
            Mot de passe
            <input name="password" type="password" required minLength={6} autoComplete="new-password" />
          </label>
          <button className="btn" disabled={upPending}>
            {upPending ? "Création…" : "Créer mon compte"}
          </button>
          {upState.error && <p className="error">{upState.error}</p>}
          {upState.message && <p className="success">{upState.message}</p>}
        </form>
      )}
    </div>
  );
}
