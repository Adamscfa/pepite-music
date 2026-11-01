"use client";

import Link from "next/link";
import { useEffect } from "react";
import { logError } from "@/app/error-actions";

// Page affichée quand une page plante. L'erreur est notée pour l'administrateur.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logError({ message: error.message, digest: error.digest, path: window.location.pathname });
  }, [error]);

  return (
    <div className="empty" style={{ marginTop: 40 }}>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>Oups, cette page a eu un souci.</h1>
      <p>C&apos;est noté de notre côté. Tu peux réessayer, ou revenir à l&apos;accueil.</p>
      <div className="row" style={{ justifyContent: "center" }}>
        <button type="button" className="btn" onClick={reset}>
          Réessayer
        </button>
        <Link href="/" className="btn ghost">
          Accueil
        </Link>
      </div>
    </div>
  );
}
