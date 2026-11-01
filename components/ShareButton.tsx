"use client";

import { useState } from "react";
import Icon from "./Icon";

// Partage via le menu du téléphone, ou copie le lien sur ordinateur.
// path : adresse à partager (par défaut, la page en cours). compact : version icône pour les avis.
export default function ShareButton({ title, path, compact = false }: { title: string; path?: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={compact ? "action share" : "btn ghost"}
      onClick={async () => {
        const url = path ? new URL(path, window.location.origin).href : window.location.href;
        if (navigator.share) {
          await navigator.share({ title, url }).catch(() => {});
          return;
        }
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {compact && <Icon name="share" size={19} />}
      <span className={compact ? "action-label" : undefined}>{copied ? "Lien copié ✓" : "Partager"}</span>
    </button>
  );
}
