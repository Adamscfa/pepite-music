import type { Metadata } from "next";
import Link from "next/link";
import ChartTracks from "@/app/classements/ChartTracks";
import AlbumTile from "@/components/AlbumTile";
import Carousel from "@/components/Carousel";
import Cover from "@/components/Cover";
import Icon from "@/components/Icon";
import { getCurrentProfile, getMostDiscussed, getTopRatedAlbums, type Discussed } from "@/lib/data";
import {
  getChart,
  getFreshArtists,
  getGenres,
  getLocalScene,
  getNewReleases,
  LOCAL_SCENES,
} from "@/lib/deezer";
import { formatScore } from "@/lib/format";
import { getForYou } from "@/lib/recommend";
import { getTrends } from "@/lib/trends";
import { sharpImage } from "@/lib/images";
import { getLocale } from "@/lib/server-locale";
import { t } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: t(locale, "explore"),
    description:
      locale === "fr"
        ? "Nouveaux artistes, albums tendance, genres musicaux et titres les plus commentés sur Pépite."
        : "Discover new artists, trending albums, music genres, and the most discussed tracks on Pépite.",
  };
}

export default async function ExplorePage({ searchParams }: PageProps<"/explorer">) {
  const [{ genre: rawGenre, scene: rawScene }, locale] = await Promise.all([searchParams, getLocale()]);
  const genres = await getGenres();
  const genre = genres.find((g) => String(g.id) === rawGenre) ?? null;
  const scene = LOCAL_SCENES.find((s) => s.slug === rawScene) ?? null;
  const tx = (key: Parameters<typeof t>[1]) => t(locale, key);

  return (
    <>
      <header className="explore-head">
        <div className="eyebrow">{tx("explore")}</div>
        <h1>{scene ? scene.name : genre ? genre.name : tx("findNextGem")}</h1>
        <p>
          {scene
            ? locale === "fr"
              ? "Les sons d'ici qui tournent en ce moment. Touche le bouton de lecture pour écouter un extrait."
              : "The sounds trending here right now. Tap play to listen to a preview."
            : genre
              ? locale === "fr"
                ? `Les albums, artistes et titres ${genre.name} les plus écoutés en ce moment.`
                : `The most listened-to ${genre.name} albums, artists, and tracks right now.`
              : tx("exploreDescription")}
        </p>
      </header>

      <nav className="genres" aria-label={tx("chooseGenre")}>
        <Link href="/explorer" className="chip" aria-current={genre || scene ? undefined : "page"}>
          {tx("all")}
        </Link>
        {LOCAL_SCENES.map((s) => (
          <Link
            key={s.slug}
            href={`/explorer?scene=${s.slug}`}
            className="chip local"
            aria-current={scene?.slug === s.slug ? "page" : undefined}
          >
            {s.slug === "cote-divoire" ? "🇨🇮 " : ""}
            {s.name}
          </Link>
        ))}
        {genres.map((g) => (
          <Link
            key={g.id}
            href={`/explorer?genre=${g.id}`}
            className="chip"
            aria-current={genre?.id === g.id ? "page" : undefined}
          >
            {g.name}
          </Link>
        ))}
      </nav>

      {scene ? <SceneView slug={scene.slug} locale={locale} /> : genre ? <GenreView id={genre.id} locale={locale} /> : <Overview genres={genres} locale={locale} />}
    </>
  );
}

async function Overview({ genres, locale }: { genres: Awaited<ReturnType<typeof getGenres>>; locale: "fr" | "en" }) {
  const tx = (key: Parameters<typeof t>[1]) => t(locale, key);
  const me = await getCurrentProfile();
  const [forYou, local, trending, fresh, releases, topRated, tracks, albums] = await Promise.all([
    me ? getForYou(me) : Promise.resolve([]),
    getLocalScene("cote-divoire"),
    getTrends(15),
    getFreshArtists(14),
    getNewReleases(15),
    getTopRatedAlbums(12),
    getMostDiscussed({ tracks: true, limit: 8 }),
    getMostDiscussed({ tracks: false, limit: 8 }),
  ]);

  return (
    <>
      {forYou.length > 0 && (
        <Carousel eyebrow={tx("recommendedFromRatings")} title={tx("forYou")}>
          {forYou.map((a) => (
            <AlbumTile key={a.id} id={a.id} title={a.title} subtitle={`${a.artist} · ${a.because}`} cover={a.cover} />
          ))}
        </Carousel>
      )}

      {local && local.tracks.length > 0 && (
        <section className="carousel local-box">
          <div className="feed-head">
            <div>
              <div className="eyebrow">🇨🇮 Made in Côte d&apos;Ivoire</div>
              <h2 className="section-title" style={{ margin: 0 }}>
                {tx("madeInIvoryCoast")}
              </h2>
            </div>
            <Link href="/explorer?scene=cote-divoire" className="more-link">
              {tx("seeTop")}
            </Link>
          </div>
          <div className="genres" style={{ marginBottom: 12 }}>
            {LOCAL_SCENES.slice(1).map((s) => (
              <Link key={s.slug} href={`/explorer?scene=${s.slug}`} className="chip">
                {s.name}
              </Link>
            ))}
          </div>
          <ChartTracks tracks={local.tracks.slice(0, 8)} />
        </section>
      )}

      {trending.albums.length > 0 && (
        <Carousel
          eyebrow={`Deezer ${locale === "fr" ? "·" : "chart ·"} ${trending.label}`}
          title={tx("trendingAlbums")}
          more={{ href: "/classements", label: tx("chartsArrow") }}
        >
          {trending.albums.map((a, i) => (
            <AlbumTile key={a.id} id={a.id} title={a.title} subtitle={a.artist} cover={a.cover} badge={`#${i + 1}`} />
          ))}
        </Carousel>
      )}

      {fresh.length > 0 && (
        <section className="carousel">
          <div className="eyebrow">{tx("newArtistsEyebrow")}</div>
          <h2 className="section-title">{tx("newArtists")}</h2>
          <div className="carousel-track artists-row">
            {fresh.map((a) => (
              <Link key={a.id} href={`/artiste/${a.id}`} className="artist-tile">
                <img {...sharpImage(a.picture, "120px")} alt="" className="cover round" loading="lazy" />
                <span className="album-name">{a.name}</span>
                <small className="small">{a.album}</small>
              </Link>
            ))}
          </div>
        </section>
      )}

      {genres.length > 0 && (
        <section className="carousel">
          <div className="eyebrow">{tx("byStyle")}</div>
          <h2 className="section-title">{tx("musicGenres")}</h2>
          <div className="genre-grid">
            {genres.map((g) => (
              <Link key={g.id} href={`/explorer?genre=${g.id}`} className="genre-card">
                <img {...sharpImage(g.picture, "(max-width: 760px) 50vw, 200px")} alt="" loading="lazy" />
                <span>{g.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="two-cols">
        <Discussion title={tx("mostDiscussedTracks")} items={tracks} tracks locale={locale} />
        <Discussion title={tx("mostDiscussedAlbums")} items={albums} tracks={false} locale={locale} />
      </div>

      {releases.length > 0 && (
        <div id="nouveautes">
          <Carousel eyebrow={tx("justReleased")} title={tx("freshThisWeek")}>
            {releases.map((a) => (
              <AlbumTile key={a.id} id={a.id} title={a.title} subtitle={a.artist} cover={a.cover} badge={locale === "fr" ? "Nouveau" : "New"} />
            ))}
          </Carousel>
        </div>
      )}

      {topRated.length > 0 && (
        <Carousel eyebrow={tx("memberCharts")} title={tx("bestRated")}>
          {topRated.map((a, i) => (
            <AlbumTile
              key={a.album_id}
              id={a.album_id}
              title={a.album_title}
              cover={a.cover_url}
              badge={`#${i + 1}`}
              subtitle={
                <>
                  ★ {formatScore(a.average)} · {a.count} note{a.count > 1 ? "s" : ""}
                </>
              }
            />
          ))}
        </Carousel>
      )}
    </>
  );
}

// Liste « les plus commentés » : on y voit le nombre de commentaires et d'avis.
function Discussion({ title, items, tracks, locale }: { title: string; items: Discussed[]; tracks: boolean; locale: "fr" | "en" }) {
  return (
    <section className="rail-box discussed">
      <h2 className="rail-title">
        <span className="flame">
          <Icon name="comment" size={20} filled />
        </span>
        {title}
      </h2>
      {items.length ? (
        <ol className="rank-list">
          {items.map((it, i) => {
            const href = tracks ? `/titre/${it.track_id}` : `/album/${it.album_id}`;
            return (
              <li key={href}>
                <span className="rank-n">{i + 1}</span>
                <Link href={href} className="rank-item">
                  <Cover src={it.cover_url} size="s" />
                  <span className="rank-text">
                    <b>{tracks ? it.track_title : it.album_title}</b>
                    <small>{it.artist_name}</small>
                  </span>
                </Link>
                <span className="rank-stat" title={`${it.reviews} ${locale === "fr" ? "avis" : "reviews"}`}>
                  <Icon name="comment" size={15} />
                  {it.comments}
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="small">
          {t(locale, "noDiscussion").replace("{item}", tracks ? t(locale, "tracks").toLowerCase() : t(locale, "albums").toLowerCase())}
        </p>
      )}
    </section>
  );
}

async function SceneView({ slug, locale }: { slug: string; locale: "fr" | "en" }) {
  const tx = (key: Parameters<typeof t>[1]) => t(locale, key);
  const scene = await getLocalScene(slug);
  const tracks = scene?.tracks ?? [];
  // Les albums d'où viennent ces titres, sans doublon.
  const albums = tracks.filter((t, i) => tracks.findIndex((x) => x.albumId === t.albumId) === i).slice(0, 15);
  return (
    <>
      {albums.length > 0 && (
        <Carousel eyebrow={tx("whereSoundsComeFrom")} title={tx("albums")}>
          {albums.map((t) => (
            <AlbumTile key={t.albumId} id={t.albumId} title={t.albumTitle} subtitle={t.artist} cover={t.cover} />
          ))}
        </Carousel>
      )}
      <section>
        <h2 className="section-title">{tx("tracks")}</h2>
        {tracks.length ? (
          <ChartTracks tracks={tracks.slice(0, 30)} />
        ) : (
          <div className="empty">{tx("nothingToShow")}</div>
        )}
      </section>
    </>
  );
}

async function GenreView({ id, locale }: { id: number; locale: "fr" | "en" }) {
  const tx = (key: Parameters<typeof t>[1]) => t(locale, key);
  const chart = await getChart(id);
  return (
    <>
      {chart.albums.length > 0 && (
        <Carousel eyebrow={tx("mostListened")} title={tx("trendingAlbums")}>
          {chart.albums.map((a, i) => (
            <AlbumTile key={a.id} id={a.id} title={a.title} subtitle={a.artist} cover={a.cover} badge={`#${i + 1}`} />
          ))}
        </Carousel>
      )}
      {chart.artists.length > 0 && (
        <section className="carousel">
          <h2 className="section-title">{tx("trendingArtists")}</h2>
          <div className="carousel-track artists-row">
            {chart.artists.map((a) => (
              <Link key={a.id} href={`/artiste/${a.id}`} className="artist-tile">
                <img {...sharpImage(a.picture, "120px")} alt="" className="cover round" loading="lazy" />
                <span className="album-name">{a.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section>
        <h2 className="section-title">{tx("mostListenedTracks")}</h2>
        {chart.tracks.length ? (
          <ChartTracks tracks={chart.tracks.slice(0, 20)} />
        ) : (
          <div className="empty">{tx("nothingToShow")}</div>
        )}
      </section>
    </>
  );
}
