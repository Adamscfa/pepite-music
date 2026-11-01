"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

// Barre de menu en bas de l'écran, seulement sur téléphone (voir globals.css).
// Au centre, « Publier » ouvre la recherche pour noter un album ou un titre.
// (Les notifications ont leur cloche dans la barre du haut.)
export default function BottomNav({
  username,
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
  const badge = (n: number) => (n > 0 ? <i className="dot">{n > 99 ? "99+" : n}</i> : null);

  return (
    <nav className="bottom-nav" aria-label="Menu principal">
      <Link href="/" aria-current={current("/")}>
        <Icon name="home" size={24} />
        Accueil
      </Link>
      <Link href="/explorer" aria-current={current("/explorer")}>
        <Icon name="explore" size={24} />
        Explorer
      </Link>
      {username ? (
        <button
          type="button"
          className="bottom-publish"
          aria-label="Publier un avis"
          onClick={() => {
            const box = document.getElementById("recherche") as HTMLInputElement | null;
            window.scrollTo({ top: 0, behavior: "smooth" });
            if (box) {
              box.placeholder = "Quel album ou titre veux-tu noter ?";
              box.focus();
            }
          }}
        >
          <span>
            <Icon name="pen" size={22} />
          </span>
        </button>
      ) : (
        <Link href="/classements" aria-current={current("/classements")}>
          <Icon name="chart" size={24} />
          Tops
        </Link>
      )}
      {username ? (
        <Link href="/messages" aria-current={current("/messages")}>
          <Icon name="mail" size={24} />
          Messages
          {badge(messages)}
        </Link>
      ) : (
        <Link href="/connexion?mode=inscription" aria-current={current("/connexion")}>
          <Icon name="pen" size={24} />
          S&apos;inscrire
        </Link>
      )}
      <Link href={profile} aria-current={current(username ? profile : "/connexion")}>
        <Icon name="user" size={24} />
        {username ? "Profil" : "Connexion"}
      </Link>
    </nav>
  );
}
