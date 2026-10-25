"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "./actions";

export default function EditProfile({ displayName, bio }: { displayName: string; bio: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});
  return (
    <details className="edit">
      <summary>Modifier mon profil</summary>
      <form action={action} className="box" style={{ marginTop: 10, maxWidth: 480 }}>
        <label className="field">
          Nom affiché
          <input name="display_name" defaultValue={displayName} required maxLength={40} />
        </label>
        <label className="field">
          Bio
          <textarea name="bio" defaultValue={bio} maxLength={200} rows={3} placeholder="Ce que tu écoutes, ce que tu aimes…" />
        </label>
        <button className="btn" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {state.error && <p className="error">{state.error}</p>}
        {state.saved && !pending && <p className="success">Profil mis à jour.</p>}
      </form>
    </details>
  );
}
