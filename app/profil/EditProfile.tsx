"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "./actions";

export default function EditProfile({
  displayName,
  bio,
  hasAvatar,
}: {
  displayName: string;
  bio: string;
  hasAvatar: boolean;
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});
  return (
    <details className="edit">
      <summary>Modifier mon profil</summary>
      <form action={action} className="box" style={{ marginTop: 10, maxWidth: 480 }}>
        <label className="field">
          Photo de profil
          <input name="avatar" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
          <small className="small">JPG, PNG, WebP ou GIF, 2 Mo maximum.</small>
        </label>
        {hasAvatar && (
          <label className="check">
            <input type="checkbox" name="remove_avatar" value="1" /> Retirer ma photo
          </label>
        )}
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
