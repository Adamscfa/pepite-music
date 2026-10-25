"use client";

import { useActionState } from "react";
import { addFavorite, addToList, sendMessage, type FormState } from "@/app/social-actions";

// Ajouter l'album à ses 4 favoris ou à une de ses listes, ou le recommander à un ami.
export default function AlbumActions({
  albumId,
  lists,
  friends,
}: {
  albumId: number;
  lists: { id: number; title: string }[];
  friends: { username: string; display_name: string }[];
}) {
  const [favState, favAction, favPending] = useActionState<FormState, FormData>(addFavorite, {});
  const [listState, listAction, listPending] = useActionState<FormState, FormData>(addToList, {});
  const [recoState, recoAction, recoPending] = useActionState<FormState, FormData>(sendMessage, {});

  return (
    <div className="box" style={{ marginTop: 14 }}>
      <form action={favAction}>
        <input type="hidden" name="album_id" value={albumId} />
        <button className="btn ghost" disabled={favPending}>
          ♥ Ajouter à mes 4 favoris
        </button>
        {favState.error && <p className="error">{favState.error}</p>}
        {favState.done && !favPending && <p className="success">Ajouté à tes favoris.</p>}
      </form>

      <form action={listAction} className="row" style={{ justifyContent: "flex-start" }}>
        <input type="hidden" name="album_id" value={albumId} />
        {lists.length ? (
          <>
            <select name="list_id" aria-label="Choisir une liste" className="select">
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
            <button className="btn ghost" disabled={listPending}>
              + Ajouter à la liste
            </button>
          </>
        ) : (
          <span className="small">Crée une liste depuis ton profil pour y ranger cet album.</span>
        )}
      </form>
      {listState.error && <p className="error">{listState.error}</p>}
      {listState.done && !listPending && <p className="success">Ajouté à la liste.</p>}

      <details className="reco">
        <summary className="btn ghost">✉ Recommander à un ami</summary>
        {friends.length ? (
          <form action={recoAction} style={{ marginTop: 10 }}>
            <input type="hidden" name="album_id" value={albumId} />
            <select name="to" aria-label="Choisir un ami" className="select">
              {friends.map((f) => (
                <option key={f.username} value={f.username}>
                  {f.display_name} (@{f.username})
                </option>
              ))}
            </select>
            <textarea
              name="body"
              maxLength={1000}
              placeholder="Un petit mot (facultatif)"
              aria-label="Ton mot"
              style={{ marginTop: 8 }}
            />
            <button className="btn" disabled={recoPending} style={{ marginTop: 8 }}>
              {recoPending ? "Envoi…" : "Envoyer"}
            </button>
            {recoState.error && <p className="error">{recoState.error}</p>}
            {recoState.done && !recoPending && <p className="success">Recommandation envoyée !</p>}
          </form>
        ) : (
          <p className="small">
            Abonne-toi à des membres (ou attends qu&apos;ils s&apos;abonnent à toi) pour leur recommander des albums.
          </p>
        )}
      </details>
    </div>
  );
}
