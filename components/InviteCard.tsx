"use client";

import Link from "next/link";
import { useState } from "react";
import type { Author } from "@/lib/data";
import Avatar from "./Avatar";
import Icon from "./Icon";

// Sur son propre profil : son lien d'invitation, à copier ou partager,
// et les personnes qu'il a déjà fait venir.
export default function InviteCard({ username, displayName, invited }: { username: string; displayName: string; invited: Author[] }) {
  const [copied, setCopied] = useState(false);
  const link = () => new URL(`/invite/${username}`, window.location.origin).href;
  const text = `Rejoins-moi sur Pépite 🎧 On y note et partage les albums qu'on écoute. Voici mon invitation :`;

  return (
    <section className="box invite-card" id="inviter">
      <h2 className="section-title">Invite tes amis</h2>
      <p className="small">
        Avec ton lien, tes amis arrivent directement sur une page « {displayName} t&apos;invite sur Pépite », et vous
        êtes abonnés l&apos;un à l&apos;autre dès leur inscription.
      </p>
      <div className="invite-link">
        <code>/invite/{username}</code>
        <button
          type="button"
          className="btn ghost"
          onClick={async () => {
            await navigator.clipboard.writeText(link());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Lien copié ✓" : "Copier le lien"}
        </button>
        <button
          type="button"
          className="btn"
          onClick={async () => {
            const url = link();
            if (navigator.share) {
              await navigator.share({ title: "Pépite", text, url }).catch(() => {});
            } else {
              window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener");
            }
          }}
        >
          <Icon name="share" size={18} /> Partager
        </button>
      </div>
      <p className="invite-count">
        {invited.length === 0
          ? "Personne n'a encore rejoint Pépite grâce à toi. À toi de jouer !"
          : `${invited.length} personne${invited.length > 1 ? "s ont" : " a"} rejoint Pépite grâce à toi 🎉`}
      </p>
      {invited.length > 0 && (
        <div className="invite-people">
          {invited.slice(0, 12).map((p) => (
            <Link key={p.username} href={`/profil/${p.username}`} title={p.display_name}>
              <Avatar user={p} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
