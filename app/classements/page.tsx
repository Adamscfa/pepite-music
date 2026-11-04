import type { Metadata } from "next";
import Link from "next/link";
import AlbumTile from "@/components/AlbumTile";
import Carousel from "@/components/Carousel";
import { CHART_GENRES, getChart, getCountryCharts, getPlaylistChart, WORLD_PLAYLIST } from "@/lib/deezer";
import CountryPicker from "./CountryPicker";
import ChartTracks from "./ChartTracks";
import { sharpImage } from "@/lib/images";
import { getTrendScope } from "@/lib/trends";
import { getLocale } from "@/lib/server-locale";
import { t } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: t(locale, "charts"),
    description:
      locale === "fr"
        ? "Les titres, albums et artistes les plus écoutés en ce moment sur Deezer."
        : "The most listened-to tracks, albums, and artists on Deezer right now.",
  };
}

export default async function ChartsPage({ searchParams }: PageProps<"/classements">) {
  const [{ genre: rawGenre, zone, id }, locale] = await Promise.all([searchParams, getLocale()]);
  const tx = (key: Parameters<typeof t>[1]) => t(locale, key);
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
  const heading =
    country?.title ??
    (world
      ? tx("topWorld")
      : genre.id
        ? locale === "fr"
          ? `Top ${genre.name} France`
          : `Top ${genre.name} France`
        : tx("topFrance"));
  const isMine = Boolean(mine) && mine?.kind !== "france";

  return (
    <>
      <div className="eyebrow">{tx("chartUpdated")}</div>
      <h1 style={{ fontSize: 30, marginBottom: 14 }}>{heading}</h1>
      {isMine && (
        <p className="small" style={{ marginTop: -8, marginBottom: 14 }}>
          {tx("localChartHelp")}
        </p>
      )}

      <div className="genres" role="navigation" aria-label={tx("chooseChart")}>
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
          {tx("countryFrance")}
        </Link>
        <Link href="/classements?zone=monde" prefetch={false} className="chip" aria-current={world ? "page" : undefined}>
          {tx("countryWorld")}
        </Link>
        {countries.length > 0 && <CountryPicker countries={countries} current={country?.id ?? null} locale={locale} />}
      </div>

      {chart.albums.length > 0 && (
        <Carousel eyebrow={tx("mostListened")} title={tx("topAlbums")}>
          {chart.albums.map((a, i) => (
            <AlbumTile key={a.id} id={a.id} title={a.title} subtitle={a.artist} cover={a.cover} badge={`#${i + 1}`} />
          ))}
        </Carousel>
      )}

      {chart.artists.length > 0 && (
        <section className="carousel">
          <div className="eyebrow">{tx("mostListened")}</div>
          <h2 className="section-title">{tx("topArtists")}</h2>
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
        <h2 className="section-title">{tx("topTracks")}</h2>
        {tracks.length ? (
          <ChartTracks tracks={tracks} />
        ) : (
          <div className="empty">
            {tx("chartUnavailable")}
          </div>
        )}
      </section>
    </>
  );
}
