import Link from "next/link";
import { getCurrentProfile, getReviewCounts, getTopContributors, getTrackReviewCounts, getWeeklyPepite } from "@/lib/data";
import { getTrends } from "@/lib/trends";
import Avatar from "./Avatar";
import Cover from "./Cover";
import DemoBadge from "./DemoBadge";
import Icon from "./Icon";
import TrendingTracks from "./TrendingTracks";

// Colonne de droite de l'accueil : albums tendance, meilleurs contributeurs, et un encart.
export default async function RightRail() {
  const me = await getCurrentProfile();
  const [trends, contributors, weekly] = await Promise.all([
    getTrends(5),
    getTopContributors(3),
    getWeeklyPepite(me?.id),
  ]);
  const { albums, tracks, label } = trends;
  const [counts, trackCounts] = await Promise.all([
    getReviewCounts(albums.map((a) => a.id)),
    getTrackReviewCounts(tracks.map((t) => t.id)),
  ]);
  const pepite = weekly.current[0] ?? weekly.lastWinner;

  return (
    <aside className="rail home-rail">
      {albums.length > 0 && (
        <section className="rail-box">
          <h2 className="rail-title">
            <span className="flame">
              <Icon name="flame" size={22} filled />
            </span>
            <span>
              Albums tendance <small className="trend-where">{label}</small>
            </span>
          </h2>
          <ol className="rank-list">
            {albums.map((a, i) => (
              <li key={a.id}>
                <span className="rank-n">{i + 1}</span>
                <Link href={`/album/${a.id}`} className="rank-item">
                  <Cover src={a.cover} size="s" />
                  <span className="rank-text">
                    <b>{a.title}</b>
                    <small>{a.artist}</small>
                  </span>
                </Link>
                <span className="rank-stat" title="Avis sur Pépite">
                  <Icon name="flame" size={15} filled />
                  {counts.get(a.id) ?? 0}
                </span>
              </li>
            ))}
          </ol>
          <Link href="/explorer" className="more-link rail-more">
            Explorer les tendances →
          </Link>
        </section>
      )}

      {tracks.length > 0 && (
        <section className="rail-box">
          <h2 className="rail-title">
            <span className="flame">
              <Icon name="music" size={22} />
            </span>
            <span>
              Titres tendance <small className="trend-where">{label}</small>
            </span>
          </h2>
          <TrendingTracks tracks={tracks} counts={Object.fromEntries(trackCounts)} variant="rail" />
          <Link href="/classements" className="more-link rail-more">
            Tous les classements →
          </Link>
        </section>
      )}

      {contributors.length > 0 && (
        <section className="rail-box">
          <h2 className="rail-title">
            <span className="trophy">
              <Icon name="trophy" size={22} />
            </span>
            Top contributeurs
          </h2>
          <ol className="rank-list">
            {contributors.map((c, i) => (
              <li key={c.username}>
                <span className="rank-n">{i + 1}</span>
                <Link href={`/profil/${c.username}`} className="rank-item">
                  <Avatar user={c} />
                  <span className="rank-text">
                    <b>
                      {c.display_name} <DemoBadge show={c.is_demo} />
                    </b>
                    <small>
                      {c.count} avis
                    </small>
                  </span>
                </Link>
                {i === 0 && (
                  <span className="crown" title="Le plus actif">
                    ♛
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {pepite && (
        <Link href={`/album/${pepite.album_id}`} className="rail-box rail-pepite">
          <div className="eyebrow">
            💎 {weekly.current[0] ? "Pépite de la semaine · vote en cours" : "Pépite de la semaine dernière"}
          </div>
          <div className="rank-item">
            <Cover src={pepite.cover_url} size="s" />
            <span className="rank-text">
              <b>{pepite.album_title}</b>
              <small>
                {pepite.artist_name} · {pepite.votes} vote{pepite.votes > 1 ? "s" : ""}
              </small>
            </span>
          </div>
        </Link>
      )}

      {!me && (
        <section className="join">
          <Icon name="music" size={40} />
          <h2>Rejoins la communauté !</h2>
          <p>Partage tes goûts, découvre de nouveaux artistes.</p>
          <Link href="/connexion?mode=inscription" className="btn join-btn">
            S&apos;inscrire maintenant
          </Link>
        </section>
      )}
    </aside>
  );
}
