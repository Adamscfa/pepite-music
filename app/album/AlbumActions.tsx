"use client";

import { useActionState } from "react";
import { addFavorite, addToList, type FormState } from "@/app/social-actions";

// Ajouter l'album à ses 4 favoris ou à une de ses listes.
export default function AlbumActions({
  albumId,
  lists,
}: {
  albumId: number;
  lists: { id: number; title: string }[];
}) {
  const [favState, favAction, favPending] = useActionState<FormState, FormData>(addFavorite, {});
  const [listState, listAction, listPending] = useActionState<FormState, FormData>(addToList, {});

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
    </div>
  );
}
