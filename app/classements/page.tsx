import type { Metadata } from "next";
import Link from "next/link";
import AlbumTile from "@/components/AlbumTile";
import Carousel from "@/components/Carousel";
import { CHART_GENRES, getChart, getCountryCharts, getPlaylistChart, WORLD_PLAYLIST } from "@/lib/deezer";
import CountryPicker from "./CountryPicker";
import ChartTracks from "./ChartTracks";
import { sharpImage } from "@/lib/images";
import { getTrendScope } from "@/lib/trends";

export const metadata: Metadata = {
  title: "Classements",
  description: "Les titres, albums et artistes les plus écoutés en ce moment sur Deezer.",
};

export default async function ChartsPage({ searchParams }: PageProps<"/classements">) {
  const { genre: rawGenre, zone, id } = await searchParams;
  const countries = await getCountryCharts();
  // Sans choix dans l'adresse : le classement « de chez toi » (ton pays, ou ton dernier choix ici).
  const mine = !zone && !rawGenre ? await getTrendScope() : null;
  // Seuls les tops de la liste Deezer sont acceptés, pas n'importe quelle playlist.
  const country =
    zone === "pays"
      ? (countries.find((c) => String(c.id) === id) ?? null)
      : mine?.kind === "pays"
        ? mine.chart
        : null;
  const world = zone === "monde" || mine?.kind === "monde";
  const france = !country && !world && !rawGenre;
  const genre = CHART_GENRES.find((g) => String(g.id) === rawGenre) ?? CHART_GENRES[0];
  const onlyTracks = world || Boolean(country);
  // Un pays ou le Monde s'affiche comme la France : top albums, top artistes et top titres.
  const chart = country
    ? await getPlaylistChart(country.id)
    : world
      ? await getPlaylistChart(WORLD_PLAYLIST)
      : await getChart(genre.id);
  const tracks = chart.tracks;
  const heading = country ? country.title : world ? "Top Monde" : genre.id ? `Top ${genre.name} France` : "Top France";
  const isMine = Boolean(mine) && mine?.kind !== "france";

  return (
    <>
      <div className="eyebrow">Classements Deezer · mis à jour chaque jour</div>
      <h1 style={{ fontSize: 30, marginBottom: 14 }}>{heading}</h1>
      {isMine && (
        <p className="small" style={{ marginTop: -8, marginBottom: 14 }}>
          Le classement de chez toi. Choisis-en un autre ci-dessous : Pépite s&apos;en souviendra pour tes tendances.
        </p>
      )}

      <div className="genres" role="navigation" aria-label="Choisir un classement">
        {CHART_GENRES.slice(1).map((g) => (
          <Link
            key={g.id}
            href={`/classements?genre=${g.id}`}
            className="chip"
            aria-current={!onlyTracks && !france && g.id === genre.id ? "page" : undefined}
          >
            {g.name}
          </Link>
        ))}
        <Link href="/classements?zone=france" prefetch={false} className="chip" aria-current={france ? "page" : undefined}>
          🇫🇷 France
        </Link>
        <Link href="/classements?zone=monde" prefetch={false} className="chip" aria-current={world ? "page" : undefined}>
          🌍 Monde
        </Link>
        {countries.length > 0 && <CountryPicker countries={countries} current={country?.id ?? null} />}
      </div>

      {chart.albums.length > 0 && (
        <Carousel eyebrow="Les plus écoutés" title="Top albums">
          {chart.albums.map((a, i) => (
            <AlbumTile key={a.id} id={a.id} title={a.title} subtitle={a.artist} cover={a.cover} badge={`#${i + 1}`} />
          ))}
        </Carousel>
      )}

      {chart.artists.length > 0 && (
        <section className="carousel">
          <div className="eyebrow">Les plus écoutés</div>
          <h2 className="section-title">Top artistes</h2>
          <div className="carousel-track artists-row">
            {chart.artists.map((a, i) => (
              <Link key={a.id} href={`/artiste/${a.id}`} className="artist-tile">
                <img {...sharpImage(a.picture, "120px")} alt="" className="cover round" loading="lazy" />
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
