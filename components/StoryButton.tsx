"use client";

import { useState } from "react";

// Fabrique l'image story de l'avis : partage direct sur téléphone, sinon téléchargement.
export default function StoryButton({ reviewId }: { reviewId: number }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn ghost"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await fetch(`/avis/${reviewId}/story`);
          const file = new File([await res.blob()], `pepite-avis-${reviewId}.png`, { type: "image/png" });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file] }).catch(() => {});
          } else {
            const url = URL.createObjectURL(file);
            const a = document.createElement("a");
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
          }
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Création…" : "📸 Image pour ta story"}
    </button>
  );
}
