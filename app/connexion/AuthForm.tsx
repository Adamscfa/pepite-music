"use client";

import { useActionState, useState } from "react";
import { signIn, signInWithGoogle, signUp, type AuthState } from "./actions";

export default function AuthForm({
  linkError,
  googleError,
  signUpFirst,
}: {
  linkError: boolean;
  googleError: boolean;
  signUpFirst: boolean;
}) {
  const [mode, setMode] = useState<"in" | "up">(signUpFirst ? "up" : "in");
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
      {googleError && (
        <p className="error">La connexion avec Google n&apos;a pas marché. Réessaie ou utilise ton e-mail.</p>
      )}

      <form action={signInWithGoogle}>
        <button className="btn google">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
            />
          </svg>
          Continuer avec Google
        </button>
      </form>
      <div className="or">ou avec ton e-mail</div>

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
            <input
              name="username"
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_.]+"
              autoComplete="username"
            />
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
