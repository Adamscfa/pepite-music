"use client";

import { useActionState, useEffect, useRef } from "react";
import { createList, type FormState } from "@/app/social-actions";
import { type Locale, t } from "@/lib/i18n";

export default function NewList({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createList, {});
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.done) form.current?.reset();
  }, [state]);

  return (
    <details className="edit" style={{ marginTop: 0, marginBottom: 14 }}>
      <summary>{t(locale, "newList")}</summary>
      <form action={action} ref={form} className="box" style={{ marginTop: 10, maxWidth: 480 }}>
        <label className="field">
          {t(locale, "listTitle")}
          <input name="title" required maxLength={80} placeholder={t(locale, "listTitlePlaceholder")} />
        </label>
        <label className="field">
          {t(locale, "listDescription")}
          <textarea name="description" maxLength={300} rows={2} placeholder={t(locale, "optional")} />
        </label>
        <button className="btn" disabled={pending}>
          {pending ? t(locale, "creatingList") : t(locale, "createList")}
        </button>
        {state.error && <p className="error">{state.error}</p>}
        {state.done && !pending && (
          <p className="success">
            {t(locale, "listCreated")} {t(locale, "listCreatedInstruction")}
          </p>
        )}
      </form>
    </details>
  );
}
