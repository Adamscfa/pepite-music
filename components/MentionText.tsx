import Link from "next/link";
import { Fragment } from "react";

// Texte d'un commentaire, où chaque @pseudo devient un lien vers le profil.
export default function MentionText({ text }: { text: string }) {
  const parts = text.split(/(@[A-Za-z0-9_.]{3,20})/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <Link key={i} href={`/profil/${part.slice(1).toLowerCase()}`} className="mention">
            {part}
          </Link>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
