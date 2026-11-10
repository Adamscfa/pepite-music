"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

const MAX_BYTES = 200 * 1024 * 1024;

function currentWeekStart() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

export default function VideoUpload({ userId }: { userId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = (new FormData(form).get("video") as File | null) ?? null;
    if (!file || file.size === 0) {
      setMessage("Choisis un fichier vidéo MP4.");
      return;
    }
    if (file.type !== "video/mp4" || !file.name.toLowerCase().endsWith(".mp4")) {
      setMessage("Seuls les fichiers MP4 sont acceptés.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setMessage("La vidéo dépasse la limite de 200 Mo.");
      return;
    }

    const supabase = getBrowserClient();
    if (!supabase) {
      setMessage("La connexion à Supabase n'est pas configurée.");
      return;
    }

    setBusy(true);
    setMessage("");
    const key = crypto.randomUUID();
    const path = `admin/${userId}/${key}.mp4`;
    let uploaded = false;
    try {
      const { error: uploadError } = await supabase.storage
        .from("weekly-videos")
        .upload(path, file, { contentType: "video/mp4", upsert: false });
      if (uploadError) {
        setMessage("L'envoi a échoué. Vérifie que le fichier SQL 15 a été exécuté, puis réessaie.");
        return;
      }
      uploaded = true;
    } catch {
      setMessage("La connexion a été interrompue pendant l'envoi. Vérifie la file avant de réessayer.");
      return;
    } finally {
      if (!uploaded) setBusy(false);
    }

    try {
      const { error: insertError } = await supabase.from("video_queue").insert({
        idempotency_key: key,
        week_start: currentWeekStart(),
        format: "duel",
        status: "pending",
        source_data: { origin: "admin-upload", original_name: file.name },
        editorial: { title: file.name.replace(/\.mp4$/i, "") },
        storage_path: path,
      });

      if (insertError) {
        let cleanupFailed = false;
        try {
          const { error: cleanupError } = await supabase.storage.from("weekly-videos").remove([path]);
          cleanupFailed = Boolean(cleanupError);
        } catch {
          cleanupFailed = true;
        }
        setMessage(
          cleanupFailed
            ? "La vidéo a été envoyée mais n'a pas pu être ajoutée à la file. Contacte l'assistance."
            : "La vidéo n'a pas pu être ajoutée à la file. Vérifie que le fichier SQL 15 a été exécuté.",
        );
        return;
      }

      form.reset();
      setMessage("Vidéo ajoutée à la file de validation.");
      router.refresh();
    } catch {
      setMessage("La connexion a été interrompue après l'envoi. Recharge la file avant de réessayer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="video-upload" onSubmit={submit}>
      <label>
        Ajouter une vidéo MP4 à valider (200 Mo maximum)
        <input type="file" name="video" accept="video/mp4,.mp4" disabled={busy} required />
      </label>
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Envoi…" : "Envoyer pour validation"}
      </button>
      {message && <p className="small" role="status">{message}</p>}
    </form>
  );
}
