"use client";

import { useActionState } from "react";
import { deleteAccount, type ProfileState } from "./actions";
import { type Locale, t } from "@/lib/i18n";

// Zone « Supprimer mon compte », repliée par défaut.
export default function DeleteAccount({ username, locale }: { username: string; locale: Locale }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(deleteAccount, {});
  return (
    <details className="edit danger-zone">
      <summary>{t(locale, "deleteAccount")}</summary>
      <form action={action} className="box" style={{ marginTop: 10 }}>
        <input type="hidden" name="locale" value={locale} />
        <p className="small" style={{ marginTop: 0 }}>
          {t(locale, "deleteAccountWarning")}
        </p>
        <label className="field">
          {t(locale, "confirmDeleteAccount")} <b>{username}</b>
          <input name="confirm" required autoComplete="off" autoCapitalize="none" />
        </label>
        <button className="btn danger-btn" disabled={pending}>
          {pending ? t(locale, "deletingAccount") : t(locale, "deletePermanently")}
        </button>
        {state.error && <p className="error">{state.error}</p>}
      </form>
    </details>
  );
}
