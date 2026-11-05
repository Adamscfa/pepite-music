"use client";

import { useState } from "react";

// Fabrique une image verticale (story) : partage direct sur téléphone, sinon téléchargement.
// Par défaut, celle d'un avis ; sinon l'adresse et le nom de fichier donnés.
export default function StoryButton({
  reviewId,
  url,
  filename,
  label = "📸 Image pour ta story",
  primary = false,
}: {
  reviewId?: number;
  url?: string;
  filename?: string;
  label?: string;
  primary?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const src = url ?? `/avis/${reviewId}/story`;
  const name = filename ?? `pepite-avis-${reviewId}.png`;
  return (
    <button
      type="button"
      className={primary ? "btn" : "btn ghost"}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await fetch(src, { cache: "no-store" });
          const file = new File([await res.blob()], name, { type: "image/png" });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file] }).catch(() => {});
          } else {
            const link = URL.createObjectURL(file);
            const a = document.createElement("a");
            a.href = link;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(link);
          }
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Création…" : label}
    </button>
  );
}
