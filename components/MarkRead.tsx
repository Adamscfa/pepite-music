"use client";

import { useEffect, useRef } from "react";

// Marque comme lu une fois la page affichée (les pastilles du menu se mettent à jour).
// Une seule fois : la page se rafraîchit ensuite, ce qui ne doit pas relancer l'action.
export default function MarkRead({ action }: { action: () => Promise<void> }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    action();
  }, [action]);
  return null;
}
