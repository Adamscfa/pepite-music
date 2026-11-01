import type { Metadata } from "next";
import Link from "next/link";
import ChartTracks from "@/app/classements/ChartTracks";
import AlbumTile from "@/components/AlbumTile";
import Carousel from "@/components/Carousel";
import Cover from "@/components/Cover";
import Icon from "@/components/Icon";
import { getMostDiscussed, getTopRatedAlbums, type Discussed } from "@/lib/data";
import { getChart, getFreshArtists, getGenres, getNewReleases, getTopAlbums } from "@/lib/deezer";
import { formatScore } from "@/lib/format";

export const metadata: Metadata = {
  title: "Explorer",
  description: "Nouveaux artistes, albums tendance, genres musicaux et titres les plus commentés sur Pépite.",
};

export default async function ExplorePage({ searchParams }: PageProps<"/explorer">) {
  const { genre: rawGenre } = await searchParams;
  const genres = await getGenres();
  const genre = genres.find((g) => String(g.id) === rawGenre) ?? null;

  return (
    <>
      <header className="explore-head">
        <div className="eyebrow">Explorer</div>
        <h1>{genre ? genre.name : "Trouve ta prochaine pépite"}</h1>
        <p>
          {genre
            ? `Les albums, artistes et titres ${genre.name} les plus écoutés en ce moment.`
            : "Nouveaux artistes, albums tendance, genres musicaux et titres dont tout le monde parle."}
        </p>
      </header>

      <nav className="genres" aria-label="Choisir un genre">
        <Link href="/explorer" className="chip" aria-current={genre ? undefined : "page"}>
          Tout
        </Link>
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

      {genre ? <GenreView id={genre.id} /> : <Overview genres={genres} />}
    </>
  );
}

async function Overview({ genres }: { genres: Awaited<ReturnType<typeof getGenres>> }) {
  const [trending, fresh, releases, topRated, tracks, albums] = await Promise.all([
    getTopAlbums(15),
    getFreshArtists(14),
    getNewReleases(15),
    getTopRatedAlbums(12),
    getMostDiscussed({ tracks: true, limit: 8 }),
    getMostDiscussed({ tracks: false, limit: 8 }),
  ]);

  return (
    <>
      {trending.length > 0 && (
        <Carousel eyebrow="Classement Deezer" title="Albums tendance" more={{ href: "/classements", label: "Classements →" }}>
          {trending.map((a, i) => (
            <AlbumTile key={a.id} id={a.id} title={a.title} subtitle={a.artist} cover={a.cover} badge={`#${i + 1}`} />
          ))}
        </Carousel>
      )}

      {fresh.length > 0 && (
        <section className="carousel">
          <div className="eyebrow">Ils viennent de sortir quelque chose</div>
          <h2 className="section-title">Nouveaux artistes à découvrir</h2>
          <div className="carousel-track artists-row">
            {fresh.map((a) => (
              <Link key={a.id} href={`/artiste/${a.id}`} className="artist-tile">
                <img src={a.picture} alt="" className="cover round" loading="lazy" />
                <span className="album-name">{a.name}</span>
                <small className="small">{a.album}</small>
              </Link>
            ))}
          </div>
        </section>
      )}

      {genres.length > 0 && (
        <section className="carousel">
          <div className="eyebrow">Par style</div>
          <h2 className="section-title">Genres musicaux</h2>
          <div className="genre-grid">
            {genres.map((g) => (
              <Link key={g.id} href={`/explorer?genre=${g.id}`} className="genre-card">
                <img src={g.picture} alt="" loading="lazy" />
                <span>{g.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="two-cols">
        <Discussion title="Titres les plus commentés" items={tracks} tracks />
        <Discussion title="Albums les plus commentés" items={albums} tracks={false} />
      </div>

      {releases.length > 0 && (
        <div id="nouveautes">
          <Carousel eyebrow="Tout juste sortis" title="Nouveautés de la semaine">
            {releases.map((a) => (
              <AlbumTile key={a.id} id={a.id} title={a.title} subtitle={a.artist} cover={a.cover} badge="Nouveau" />
            ))}
          </Carousel>
        </div>
      )}

      {topRated.length > 0 && (
        <Carousel eyebrow="Classement des membres" title="Les mieux notés sur Pépite">
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
function Discussion({ title, items, tracks }: { title: string; items: Discussed[]; tracks: boolean }) {
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
                <span className="rank-stat" title={`${it.reviews} avis`}>
                  <Icon name="comment" size={15} />
                  {it.comments}
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="small">
          Pas encore de discussion. Note un {tracks ? "titre" : "album"} et lance la conversation !
        </p>
      )}
    </section>
  );
}

async function GenreView({ id }: { id: number }) {
  const chart = await getChart(id);
  return (
    <>
      {chart.albums.length > 0 && (
        <Carousel eyebrow="Les plus écoutés" title="Albums tendance">
          {chart.albums.map((a, i) => (
            <AlbumTile key={a.id} id={a.id} title={a.title} subtitle={a.artist} cover={a.cover} badge={`#${i + 1}`} />
          ))}
        </Carousel>
      )}
      {chart.artists.length > 0 && (
        <section className="carousel">
          <h2 className="section-title">Artistes du moment</h2>
          <div className="carousel-track artists-row">
            {chart.artists.map((a) => (
              <Link key={a.id} href={`/artiste/${a.id}`} className="artist-tile">
                <img src={a.picture} alt="" className="cover round" loading="lazy" />
                <span className="album-name">{a.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section>
        <h2 className="section-title">Titres les plus écoutés</h2>
        {chart.tracks.length ? (
          <ChartTracks tracks={chart.tracks.slice(0, 20)} />
        ) : (
          <div className="empty">Rien à afficher pour ce genre pour l&apos;instant. Réessaie dans un moment.</div>
        )}
      </section>
    </>
  );
}
