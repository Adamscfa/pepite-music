import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/Avatar";
import { toggleBlock } from "@/app/social-actions";
import { getBlockedMembers, getCurrentProfile } from "@/lib/data";
import { getLocale } from "@/lib/server-locale";
import { t } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: t(await getLocale(), "blockedMembers") };
}

// La liste des membres que j'ai bloqués, pour les débloquer.
export default async function BlockedPage() {
  const [me, locale] = await Promise.all([getCurrentProfile(), getLocale()]);
  if (!me) redirect("/connexion");
  const blocked = await getBlockedMembers();
  return (
    <div className="legal-narrow">
      <Link href={`/profil/${me.username}`} className="small link-under">
        ← {t(locale, "myProfile")}
      </Link>
      <h1 style={{ fontSize: 28, margin: "10px 0 6px" }}>{t(locale, "blockedMembers")}</h1>
      <p className="small">{t(locale, "blockedMembersDescription")}</p>
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
                <button className="btn ghost">{t(locale, "unblock")}</button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty" style={{ marginTop: 16 }}>
          {t(locale, "noBlockedMembers")}
        </div>
      )}
    </div>
  );
}
