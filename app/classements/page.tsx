import type { Metadata } from "next";
import Link from "next/link";
import AlbumTile from "@/components/AlbumTile";
import Carousel from "@/components/Carousel";
import { CHART_GENRES, getChart, getCountryCharts, getPlaylistTracks, getWorldTopTracks } from "@/lib/deezer";
import CountryPicker from "./CountryPicker";
import ChartTracks from "./ChartTracks";

export const metadata: Metadata = {
  title: "Classements",
  description: "Les titres, albums et artistes les plus écoutés en ce moment sur Deezer.",
};

export default async function ChartsPage({ searchParams }: PageProps<"/classements">) {
  const { genre: rawGenre, zone, id } = await searchParams;
  const countries = await getCountryCharts();
  // Seuls les tops de la liste Deezer sont acceptés, pas n'importe quelle playlist.
  const country = zone === "pays" ? (countries.find((c) => String(c.id) === id) ?? null) : null;
  const world = zone === "monde";
  const genre = CHART_GENRES.find((g) => String(g.id) === rawGenre) ?? CHART_GENRES[0];
  const onlyTracks = world || Boolean(country);
  const [chart, playlistTracks] = await Promise.all([
    onlyTracks ? null : getChart(genre.id),
    country ? getPlaylistTracks(country.id) : world ? getWorldTopTracks() : null,
  ]);
  const tracks = playlistTracks ?? chart?.tracks ?? [];
  const heading = country ? country.title : world ? "Top Monde" : genre.id ? `Top ${genre.name} France` : "Top France";

  return (
    <>
      <div className="eyebrow">Classements Deezer · mis à jour chaque jour</div>
      <h1 style={{ fontSize: 30, marginBottom: 14 }}>{heading}</h1>

      <div className="genres" role="navigation" aria-label="Choisir un classement">
        {CHART_GENRES.map((g) => (
          <Link
            key={g.id}
            href={g.id ? `/classements?genre=${g.id}` : "/classements"}
            className="chip"
            aria-current={!onlyTracks && g.id === genre.id ? "page" : undefined}
          >
            {g.name}
          </Link>
        ))}
        <Link href="/classements?zone=monde" className="chip" aria-current={world ? "page" : undefined}>
          🌍 Monde
        </Link>
        {countries.length > 0 && <CountryPicker countries={countries} current={country?.id ?? null} />}
      </div>

      {chart && chart.albums.length > 0 && (
        <Carousel eyebrow="Les plus écoutés" title="Top albums">
          {chart.albums.map((a, i) => (
            <AlbumTile key={a.id} id={a.id} title={a.title} subtitle={a.artist} cover={a.cover} badge={`#${i + 1}`} />
          ))}
        </Carousel>
      )}

      {chart && chart.artists.length > 0 && (
        <section className="carousel">
          <div className="eyebrow">Les plus écoutés</div>
          <h2 className="section-title">Top artistes</h2>
          <div className="carousel-track artists-row">
            {chart.artists.map((a, i) => (
              <Link key={a.id} href={`/artiste/${a.id}`} className="artist-tile">
                <img src={a.picture} alt="" className="cover round" />
                <span className="album-name">
                  {i + 1}. {a.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title">Top titres</h2>
        {tracks.length ? (
          <ChartTracks tracks={tracks} />
        ) : (
          <div className="empty">
            Le classement n&apos;est pas disponible pour l&apos;instant. Réessaie dans un moment.
          </div>
        )}
      </section>
    </>
  );
}
