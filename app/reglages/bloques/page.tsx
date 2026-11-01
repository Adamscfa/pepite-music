import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/Avatar";
import { toggleBlock } from "@/app/social-actions";
import { getBlockedMembers, getCurrentProfile } from "@/lib/data";

export const metadata: Metadata = { title: "Membres bloqués" };

// La liste des membres que j'ai bloqués, pour les débloquer.
export default async function BlockedPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/connexion");
  const blocked = await getBlockedMembers();
  return (
    <div className="legal-narrow">
      <Link href={`/profil/${me.username}`} className="small link-under">
        ← Mon profil
      </Link>
      <h1 style={{ fontSize: 28, margin: "10px 0 6px" }}>Membres bloqués</h1>
      <p className="small">
        Tu ne vois pas leurs avis ni leurs commentaires, et vous ne pouvez pas vous écrire. Pour bloquer quelqu&apos;un,
        va sur son profil et touche ⋯.
      </p>
      {blocked.length ? (
        <div className="notifs" style={{ marginTop: 16 }}>
          {blocked.map((m) => (
            <div key={m.id} className="notif">
              <Avatar user={m} />
              <span style={{ flex: 1 }}>
                <b>{m.display_name}</b>
                <small>@{m.username}</small>
              </span>
              <form action={toggleBlock}>
                <input type="hidden" name="user_id" value={m.id} />
                <input type="hidden" name="block" value="0" />
                <button className="btn ghost">Débloquer</button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty" style={{ marginTop: 16 }}>
          Tu n&apos;as bloqué personne.
        </div>
      )}
    </div>
  );
}
