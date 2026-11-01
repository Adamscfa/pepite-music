"use client";

import Link from "next/link";
import Icon from "./Icon";

// « Publier un avis » : on commence par chercher l'album ou le titre à noter.
export default function PublishButton({ loggedIn }: { loggedIn: boolean }) {
  if (!loggedIn) {
    return (
      <Link href="/connexion?mode=inscription" className="publish">
        <Icon name="pen" size={18} /> Publier un avis
      </Link>
    );
  }
  return (
    <button
      type="button"
      className="publish"
      onClick={() => {
        const box = document.getElementById("recherche") as HTMLInputElement | null;
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (box) {
          box.placeholder = "Quel album ou titre veux-tu noter ?";
          box.focus();
        }
      }}
    >
      <Icon name="pen" size={18} /> Publier un avis
    </button>
  );
}
