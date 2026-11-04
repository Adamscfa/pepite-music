"use client";

import { useActionState, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Author } from "@/lib/data";
import { updateProfile, type ProfileState } from "./actions";
import Avatar from "@/components/Avatar";

export default function EditProfile({ user, bio }: { user: Author; bio: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState<"name" | "bio" | "username" | null>(null);
  const updateAndRefresh = useCallback(
    async (previous: ProfileState, formData: FormData) => {
      const state = await updateProfile(previous, formData);
      if (state.saved) {
        setEditing(null);
        router.refresh();
      }
      return state;
    },
    [router],
  );
  const [avatarState, avatarAction, avatarPending] = useActionState<ProfileState, FormData>(updateAndRefresh, {});
  const [nameState, nameAction, namePending] = useActionState<ProfileState, FormData>(updateAndRefresh, {});
  const [bioState, bioAction, bioPending] = useActionState<ProfileState, FormData>(updateAndRefresh, {});
  const [usernameState, usernameAction, usernamePending] = useActionState<ProfileState, FormData>(updateAndRefresh, {});
  const avatarInput = useRef<HTMLInputElement>(null);

  return (
    <section className="profile-editor" aria-label="Modifier mon profil">
      <form action={avatarAction} className="profile-editor-photo">
        <input
          ref={avatarInput}
          className="profile-editor-file"
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          aria-label="Choisir une photo de profil"
          onChange={(event) => {
            if (event.currentTarget.files?.length) event.currentTarget.form?.requestSubmit();
          }}
        />
        <div className="profile-editor-avatar">
          <Avatar user={user} big />
          <button
            type="button"
            className="profile-editor-camera"
            aria-label="Ajouter ou modifier la photo de profil"
            onClick={() => avatarInput.current?.click()}
            disabled={avatarPending}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 7h3l1.5-2h7L17 7h3v12H4z" />
              <circle cx="12" cy="13" r="3.5" />
              <path d="M19 3v4m-2-2h4" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          className="btn ghost profile-editor-change-photo"
          onClick={() => avatarInput.current?.click()}
          disabled={avatarPending}
        >
          {avatarPending ? "Envoi…" : "Modifier"}
        </button>
        <small className="small">JPG, PNG, WebP ou GIF, 2 Mo maximum.</small>
        {avatarState.error && <p className="error">{avatarState.error}</p>}
        {avatarState.saved && !avatarPending && <p className="success">Photo mise à jour.</p>}
      </form>

      {user.avatar_url && (
        <form action={avatarAction} className="profile-editor-remove">
          <input type="hidden" name="remove_avatar" value="1" />
          <button className="link-btn" disabled={avatarPending}>
            Retirer ma photo
          </button>
        </form>
      )}

      <section className="profile-editor-section">
        <div className="profile-editor-section-head">
          <h2>About</h2>
          {editing !== "bio" && (
            <button
              type="button"
              className="profile-editor-pencil"
              aria-label="Modifier About"
              onClick={() => setEditing("bio")}
            >
              <PencilIcon />
            </button>
          )}
        </div>
        {editing === "bio" ? (
          <form action={bioAction} className="profile-editor-form">
            <textarea name="bio" defaultValue={bio} maxLength={200} rows={3} placeholder="Share a thought" autoFocus />
            <div className="profile-editor-form-actions">
              <button type="button" className="btn ghost" onClick={() => setEditing(null)} disabled={bioPending}>
                Annuler
              </button>
              <button className="btn" disabled={bioPending}>
                {bioPending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
            {bioState.error && <p className="error">{bioState.error}</p>}
            {bioState.saved && !bioPending && <p className="success">Bio mise à jour.</p>}
          </form>
        ) : (
          <p className={bio ? "profile-editor-value" : "profile-editor-placeholder"}>
            {bio || "Share a thought"}
          </p>
        )}
      </section>

      <section className="profile-editor-section">
        <div className="profile-editor-section-head">
          <h2>Nom</h2>
          {editing !== "name" && (
            <button
              type="button"
              className="profile-editor-pencil"
              aria-label="Modifier le nom"
              onClick={() => setEditing("name")}
            >
              <PencilIcon />
            </button>
          )}
        </div>
        {editing === "name" ? (
          <form action={nameAction} className="profile-editor-form">
            <input name="display_name" defaultValue={user.display_name} required maxLength={40} autoFocus />
            <div className="profile-editor-form-actions">
              <button type="button" className="btn ghost" onClick={() => setEditing(null)} disabled={namePending}>
                Annuler
              </button>
              <button className="btn" disabled={namePending}>
                {namePending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
            {nameState.error && <p className="error">{nameState.error}</p>}
            {nameState.saved && !namePending && <p className="success">Nom mis à jour.</p>}
          </form>
        ) : (
          <h1 className="profile-editor-value">{user.display_name}</h1>
        )}
      </section>

      <section className="profile-editor-section">
        <div className="profile-editor-section-head">
          <h2>Identifiant</h2>
          {editing !== "username" && (
            <button
              type="button"
              className="profile-editor-pencil"
              aria-label="Modifier l’identifiant"
              onClick={() => setEditing("username")}
            >
              <PencilIcon />
            </button>
          )}
        </div>
        {editing === "username" ? (
          <form action={usernameAction} className="profile-editor-form">
            <label className="small" htmlFor="profile-username">Pseudo visible après @ et utilisé dans les liens</label>
            <input
              id="profile-username"
              name="username"
              defaultValue={user.username}
              required
              minLength={3}
              maxLength={20}
              pattern="[A-Za-z0-9_.]{3,20}"
              autoCapitalize="none"
              autoCorrect="off"
              autoFocus
            />
            <div className="profile-editor-form-actions">
              <button type="button" className="btn ghost" onClick={() => setEditing(null)} disabled={usernamePending}>
                Annuler
              </button>
              <button className="btn" disabled={usernamePending}>
                {usernamePending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
            {usernameState.error && <p className="error">{usernameState.error}</p>}
            {usernameState.saved && !usernamePending && <p className="success">Identifiant mis à jour. Tes anciens liens restent valides.</p>}
          </form>
        ) : (
          <p className="profile-editor-value">@{user.username}</p>
        )}
      </section>
    </section>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m15 5 4 4M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
    </svg>
  );
}
