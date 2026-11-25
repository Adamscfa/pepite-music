import Link from "next/link";
import { getCurrentProfile } from "@/lib/data";
import { getHomeExtras } from "@/lib/home";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/server-locale";
import Avatar from "./Avatar";
import Cover from "./Cover";
import DemoBadge from "./DemoBadge";
import Icon from "./Icon";
import TrendingTracks from "./TrendingTracks";

// Colonne de droite de l'accueil : albums tendance, meilleurs contributeurs, et un encart.
export default async function RightRail() {
  const [me, extras, locale] = await Promise.all([getCurrentProfile(), getHomeExtras(), getLocale()]);
  const albums = extras.trends.albums.slice(0, 5);
  const tracks = extras.trends.tracks.slice(0, 5);
  const label = extras.trends.label;
  const contributors = extras.contributors.slice(0, 3);
  const { weekly, albumCounts: counts, trackCounts } = extras;
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
              {t(locale, "trendingAlbums")} <small className="trend-where">{label}</small>
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
                <span className="rank-stat" title={t(locale, "reviewsOnPepite")}>
                  <Icon name="flame" size={15} filled />
                  {counts.get(a.id) ?? 0}
                </span>
              </li>
            ))}
          </ol>
          <Link href="/explorer" className="more-link rail-more">
            {t(locale, "exploreTrends")} →
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
              {t(locale, "trendingTracks")} <small className="trend-where">{label}</small>
            </span>
          </h2>
          <TrendingTracks tracks={tracks} counts={Object.fromEntries(trackCounts)} variant="rail" />
          <Link href="/classements" className="more-link rail-more">
            {t(locale, "allCharts")} →
          </Link>
        </section>
      )}

      {contributors.length > 0 && (
        <section className="rail-box">
          <h2 className="rail-title">
            <span className="trophy">
              <Icon name="trophy" size={22} />
            </span>
            {t(locale, "topContributors")}
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
                      {t(locale, "reviewsCount").replace("{count}", String(c.count))}
                    </small>
                  </span>
                </Link>
                {i === 0 && (
                  <span className="crown" title={t(locale, "mostActive")}>
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
            💎 {weekly.current[0] ? t(locale, "weeklyGemOngoing") : t(locale, "weeklyGemLast")}
          </div>
          <div className="rank-item">
            <Cover src={pepite.cover_url} size="s" />
            <span className="rank-text">
              <b>{pepite.album_title}</b>
              <small>
                {pepite.artist_name} ·{" "}
                {(pepite.votes === 1 ? t(locale, "votesCountOne") : t(locale, "votesCountMany")).replace(
                  "{count}",
                  String(pepite.votes),
                )}
              </small>
            </span>
          </div>
        </Link>
      )}

      {!me && (
        <section className="join">
          <Icon name="music" size={40} />
          <h2>{t(locale, "joinCommunity")}</h2>
          <p>{t(locale, "joinCommunityText")}</p>
          <Link href="/connexion?mode=inscription" className="btn join-btn">
            {t(locale, "signUpNow")}
          </Link>
        </section>
      )}
    </aside>
  );
}
