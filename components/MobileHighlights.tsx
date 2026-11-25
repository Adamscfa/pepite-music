import Link from "next/link";
import { getHomeExtras } from "@/lib/home";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/server-locale";
import Avatar from "./Avatar";
import Cover from "./Cover";
import DemoBadge from "./DemoBadge";
import Icon from "./Icon";
import TrendingTracks from "./TrendingTracks";

// Sur téléphone seulement (voir globals.css) : la Pépite de la semaine, puis les albums
// et titres tendance et les meilleurs contributeurs, en rangées à faire glisser, en haut du fil.
// Sur ordinateur, ces infos sont dans la colonne de droite (RightRail).
export default async function MobileHighlights() {
  const [extras, locale] = await Promise.all([getHomeExtras(), getLocale()]);
  const { trends, contributors, weekly, albumCounts: counts, trackCounts } = extras;
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
            <small>💎 {weekly.current[0] ? t(locale, "weeklyGemOngoing") : t(locale, "weeklyGemLast")}</small>
            <b>{pepite.album_title}</b>
            <small>
              {pepite.artist_name} ·{" "}
              {(pepite.votes === 1 ? t(locale, "votesCountOne") : t(locale, "votesCountMany")).replace(
                "{count}",
                String(pepite.votes),
              )}
            </small>
          </span>
          <span className="more-link">{t(locale, "voteNow")} →</span>
        </Link>
      )}

      {top.length > 0 && (
        <section className="strip">
          <div className="strip-head">
            <h2>
              <span className="flame">
                <Icon name="flame" size={20} filled />
              </span>
              {t(locale, "trendingAlbums")} <small className="trend-where">{trends.label}</small>
            </h2>
            <Link href="/explorer" className="more-link">
              {t(locale, "seeAll")} →
            </Link>
          </div>
          <div className="strip-track">
            {top.map((a, i) => (
              <Link key={a.id} href={`/album/${a.id}`} className="strip-album">
                <span className="strip-cover">
                  <Cover src={a.cover} size="l" alt={t(locale, "albumCoverOf").replace("{title}", a.title)} />
                  <span className="strip-rank">{i + 1}</span>
                </span>
                <b>{a.title}</b>
                <small>{a.artist}</small>
                {(counts.get(a.id) ?? 0) > 0 && (
                  <small className="strip-stat">
                    <Icon name="flame" size={13} filled />{" "}
                    {t(locale, "reviewsCount").replace("{count}", String(counts.get(a.id)))}
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
              {t(locale, "trendingTracks")} <small className="trend-where">{trends.label}</small>
            </h2>
            <Link href="/classements" className="more-link">
              {t(locale, "seeAll")} →
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
              {t(locale, "topContributors")}
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
                  {t(locale, "reviewsCount").replace("{count}", String(c.count))} <DemoBadge show={c.is_demo} />
                </small>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
