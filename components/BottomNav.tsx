"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Barre de menu en bas de l'écran, seulement sur téléphone (voir globals.css).
export default function BottomNav({
  username,
  notifications,
  messages,
}: {
  username: string | null;
  notifications: number;
  messages: number;
}) {
  const pathname = usePathname();
  const current = (match: string) =>
    (match === "/" ? pathname === "/" : pathname.startsWith(match)) ? "page" : undefined;
  const profile = username ? `/profil/${username}` : "/connexion";

  return (
    <nav className="bottom-nav" aria-label="Menu principal">
      <Link href="/" aria-current={current("/")}>
        <span aria-hidden="true">⌂</span>Accueil
      </Link>
      <button
        type="button"
        onClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          document.getElementById("recherche")?.focus();
        }}
      >
        <span aria-hidden="true">⌕</span>Recherche
      </button>
      <Link href="/classements" aria-current={current("/classements")}>
        <span aria-hidden="true">♛</span>Tops
      </Link>
      {username && (
        <>
          <Link href="/messages" aria-current={current("/messages")}>
            <span aria-hidden="true">✉</span>Messages
            {messages > 0 && <i className="dot">{messages}</i>}
          </Link>
          <Link href="/notifications" aria-current={current("/notifications")}>
            <span aria-hidden="true">🔔</span>Notifs
            {notifications > 0 && <i className="dot">{notifications}</i>}
          </Link>
        </>
      )}
      <Link href={profile} aria-current={current(username ? profile : "/connexion")}>
        <span aria-hidden="true">☺</span>
        {username ? "Profil" : "Connexion"}
      </Link>
    </nav>
  );
}
