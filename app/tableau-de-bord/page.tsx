import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import { getCurrentProfile } from "@/lib/data";
import { getDashboard, type Member } from "@/lib/dashboard";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Tableau de bord" };

const fmtDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Abidjan" });

// Réservé aux admins : combien de membres, d'où ça vient, qui est actif.
export default async function DashboardPage() {
  const me = await getCurrentProfile();
  if (!me?.is_admin) notFound();
  const d = await getDashboard();
  const max = Math.max(1, ...d.perDay.map((p) => p.count));

  const tiles = [
    { label: "Membres inscrits", value: d.total, note: d.demo ? `+ ${d.demo} comptes démo, non comptés` : undefined },
    { label: "Nouveaux aujourd'hui", value: d.today },
    { label: "Nouveaux sur 7 jours", value: d.week },
    { label: "Nouveaux sur 30 jours", value: d.month },
    { label: "Actifs cette semaine", value: d.activeWeek, note: "ont publié un avis ou un commentaire" },
    {
      label: "Premier pas terminé",
      value: d.onboarded,
      note: d.total ? `${Math.round((d.onboarded / d.total) * 100)} % des membres` : undefined,
    },
    { label: "Avis publiés", value: d.totalReviews, note: "démo comprise" },
    { label: "Commentaires", value: d.totalComments, note: "démo compris" },
  ];

  return (
    <div className="dash">
      <div className="eyebrow">Réservé aux admins</div>
      <h1>Tableau de bord</h1>

      <div className="dash-tiles">
        {tiles.map((t) => (
          <div key={t.label} className="dash-tile">
            <small>{t.label}</small>
            <b>{t.value.toLocaleString("fr-FR")}</b>
            {t.note && <span>{t.note}</span>}
          </div>
        ))}
      </div>

      <section className="dash-box">
        <h2 className="section-title">Inscriptions par jour</h2>
        <p className="small">Les 30 derniers jours (comptes démo exclus). Touche une barre pour voir le chiffre.</p>
        <div className="dash-chart" role="img" aria-label="Inscriptions par jour sur 30 jours">
          {d.perDay.map((p) => (
            <div key={p.day} className="dash-bar" tabIndex={0} data-tip={`${fmtDay(p.day)} : ${p.count} inscription${p.count > 1 ? "s" : ""}`}>
              <span style={{ height: `${(p.count / max) * 100}%` }} className={p.count ? "" : "zero"} />
            </div>
          ))}
        </div>
        <div className="dash-axis">
          <span>{fmtDay(d.perDay[0].day)}</span>
          <span>max {max} / jour</span>
          <span>aujourd&apos;hui</span>
        </div>
        <details className="dash-table">
          <summary>Voir en tableau</summary>
          <table>
            <tbody>
              {[...d.perDay].reverse().map((p) => (
                <tr key={p.day}>
                  <td>{fmtDay(p.day)}</td>
                  <td>{p.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <div className="dash-two">
        <MemberList title="Les plus suivis" members={d.mostFollowed} stat={(m) => `${m.followers} abonné${m.followers > 1 ? "s" : ""}`} />
        <MemberList title="Les plus actifs" members={d.mostActive} stat={(m) => `${m.reviews} avis`} />
      </div>

      <section className="dash-box">
        <h2 className="section-title">Derniers inscrits</h2>
        {d.latest.length ? (
          <div className="dash-members">
            {d.latest.map((m) => (
              <Link key={m.id} href={`/profil/${m.username}`} className="dash-member">
                <Avatar user={m} />
                <span className="dash-who">
                  <b>{m.display_name}</b>
                  <small>
                    @{m.username} · inscrit le {fmtDate(m.created_at)}
                  </small>
                </span>
                <span className="dash-nums">
                  <small>{m.reviews} avis</small>
                  <small>{m.followers} abonnés</small>
                  <small>{m.following} abonnements</small>
                  <small>{m.lastActive ? `actif ${timeAgo(m.lastActive)}` : m.onboarded ? "pas encore actif" : "premier pas non fini"}</small>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty">Personne ne s&apos;est encore inscrit.</p>
        )}
      </section>
    </div>
  );
}

function MemberList({ title, members, stat }: { title: string; members: Member[]; stat: (m: Member) => string }) {
  return (
    <section className="dash-box">
      <h2 className="section-title">{title}</h2>
      {members.length ? (
        <ol className="rank-list">
          {members.map((m, i) => (
            <li key={m.id}>
              <span className="rank-n">{i + 1}</span>
              <Link href={`/profil/${m.username}`} className="rank-item">
                <Avatar user={m} />
                <span className="rank-text">
                  <b>{m.display_name}</b>
                  <small>@{m.username}</small>
                </span>
              </Link>
              <span className="rank-stat">{stat(m)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty">Pas encore de données.</p>
      )}
    </section>
  );
}
