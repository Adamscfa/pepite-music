"use client";

import Link from "next/link";
import Icon from "./Icon";
import { type Locale, t } from "@/lib/i18n";

// « Publier un avis » : on commence par chercher l'album ou le titre à noter.
export default function PublishButton({ loggedIn, locale }: { loggedIn: boolean; locale: Locale }) {
  if (!loggedIn) {
    return (
      <Link href="/connexion?mode=inscription" className="publish">
        <Icon name="pen" size={18} /> {t(locale, "publishReview")}
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
          box.placeholder =
            locale === "fr" ? "Quel album ou titre veux-tu noter ?" : "Which album or track would you like to rate?";
          box.focus();
        }
      }}
    >
      <Icon name="pen" size={18} /> {t(locale, "publishReview")}
    </button>
  );
}
