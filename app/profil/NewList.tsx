"use client";

import { useActionState, useEffect, useRef } from "react";
import { createList, type FormState } from "@/app/social-actions";

export default function NewList() {
  const [state, action, pending] = useActionState<FormState, FormData>(createList, {});
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.done) form.current?.reset();
  }, [state]);

  return (
    <details className="edit" style={{ marginTop: 0, marginBottom: 14 }}>
      <summary>+ Nouvelle liste</summary>
      <form action={action} ref={form} className="box" style={{ marginTop: 10, maxWidth: 480 }}>
        <label className="field">
          Titre
          <input name="title" required maxLength={80} placeholder="Mes albums de l'été" />
        </label>
        <label className="field">
          Description
          <textarea name="description" maxLength={300} rows={2} placeholder="Facultatif" />
        </label>
        <button className="btn" disabled={pending}>
          {pending ? "Création…" : "Créer la liste"}
        </button>
        {state.error && <p className="error">{state.error}</p>}
        {state.done && !pending && <p className="success">Liste créée. Ajoute des albums depuis leur page.</p>}
      </form>
    </details>
  );
}
