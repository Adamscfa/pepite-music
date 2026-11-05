import Link from "next/link";
import { getHomeExtras } from "@/lib/home";
import Avatar from "./Avatar";
import Cover from "./Cover";
import DemoBadge from "./DemoBadge";
import Icon from "./Icon";
import TrendingTracks from "./TrendingTracks";

// Sur téléphone seulement (voir globals.css) : la Pépite de la semaine, puis les albums
// et titres tendance et les meilleurs contributeurs, en rangées à faire glisser, en haut du fil.
// Sur ordinateur, ces infos sont dans la colonne de droite (RightRail).
export default async function MobileHighlights() {
  const { trends, contributors, weekly, albumCounts: counts, trackCounts } = await getHomeExtras();
  const top = trends.albums.slice(0, 10);
  const tracks = trends.tracks.slice(0, 10);
  const pepite = weekly.current[0] ?? weekly.lastWinner;
  if (!top.length && !contributors.length && !tracks.length && !pepite) return null;

  return (
    <div className="mobile-strips">
      {pepite && (
        <Link href={`/album/${pepite.album_id}`} className="pepite-mobile">
          <Cover src={pepite.cover_url} size="m" />
          <span>
            <small>💎 {weekly.current[0] ? "Pépite de la semaine · vote en cours" : "Pépite de la semaine dernière"}</small>
            <b>{pepite.album_title}</b>
            <small>
              {pepite.artist_name} · {pepite.votes} vote{pepite.votes > 1 ? "s" : ""}
            </small>
          </span>
          <span className="more-link">Voter →</span>
        </Link>
      )}

      {top.length > 0 && (
        <section className="strip">
          <div className="strip-head">
            <h2>
              <span className="flame">
                <Icon name="flame" size={20} filled />
              </span>
              Albums tendance <small className="trend-where">{trends.label}</small>
            </h2>
            <Link href="/explorer" className="more-link">
              Tout voir →
            </Link>
          </div>
          <div className="strip-track">
            {top.map((a, i) => (
              <Link key={a.id} href={`/album/${a.id}`} className="strip-album">
                <span className="strip-cover">
                  <Cover src={a.cover} size="l" alt={`Pochette de ${a.title}`} />
                  <span className="strip-rank">{i + 1}</span>
                </span>
                <b>{a.title}</b>
                <small>{a.artist}</small>
                {(counts.get(a.id) ?? 0) > 0 && (
                  <small className="strip-stat">
                    <Icon name="flame" size={13} filled /> {counts.get(a.id)} avis
                  </small>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {tracks.length > 0 && (
        <section className="strip">
          <div className="strip-head">
            <h2>
              <span className="flame">
                <Icon name="music" size={20} />
              </span>
              Titres tendance <small className="trend-where">{trends.label}</small>
            </h2>
            <Link href="/classements" className="more-link">
              Tout voir →
            </Link>
          </div>
          <TrendingTracks tracks={tracks} counts={Object.fromEntries(trackCounts)} variant="strip" />
        </section>
      )}

      {contributors.length > 0 && (
        <section className="strip">
          <div className="strip-head">
            <h2>
              <span className="trophy">
                <Icon name="trophy" size={20} />
              </span>
              Top contributeurs
            </h2>
          </div>
          <div className="strip-track people">
            {contributors.map((c, i) => (
              <Link key={c.username} href={`/profil/${c.username}`} className="strip-person">
                <span className={i === 0 ? "ring first" : "ring"}>
                  <Avatar user={c} />
                  {i === 0 && <span className="strip-crown">♛</span>}
                </span>
                <b>{c.display_name}</b>
                <small>
                  {c.count} avis <DemoBadge show={c.is_demo} />
                </small>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
