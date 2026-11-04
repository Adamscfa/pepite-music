import "server-only";
import { getTopRatedAlbums } from "./data";
import {
  getChart,
  getCountryCharts,
  getNewReleases,
  getPlaylistTracks,
  type AlbumHit,
  type ChartTrack,
  WORLD_PLAYLIST,
  type CountryChart,
} from "./deezer";
import { getTrendScope } from "./trends";
import { inCountry } from "./country-names";

// Studio TikTok (réservé aux admins) : une série d'images verticales prêtes à poster
// en carrousel, avec le texte et les hashtags qui vont avec.

export type StudioTheme = "pays" | "monde" | "notes" | "sorties" | "hasard" | "affiche";
export type StudioKind = "albums" | "titres";
export type StudioItem = { kind: "album" | "titre"; id: number; title: string; artist: string };

export const THEMES: { id: StudioTheme; label: string }[] = [
  { id: "pays", label: "Top d'un pays" },
  { id: "monde", label: "Top Monde" },
  { id: "notes", label: "Les mieux notés sur Pépite" },
  { id: "sorties", label: "Sorties de la semaine" },
  { id: "hasard", label: "Au hasard" },
  { id: "affiche", label: "Affiche Top 10 du moment" },
];

// Titres d'un top et albums dont ils viennent, sans chercher les photos des artistes
// (inutiles ici, et c'est ce qui prenait le plus de temps).
async function lightChart(id: number) {
  const tracks = await getPlaylistTracks(id);
  const seen = new Set<number>();
  const albums: AlbumHit[] = [];
  for (const t of tracks) {
    if (seen.has(t.albumId)) continue;
    seen.add(t.albumId);
    albums.push({ id: t.albumId, title: t.albumTitle, artist: t.artist, cover: t.cover });
  }
  return { tracks, albums };
}

// Mélange qui donne toujours le même résultat pour une même « graine »
// (pour que l'aperçu et les images téléchargées correspondent).
function shuffle<T>(list: T[], seed: number): T[] {
  const out = [...list];
  let x = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    x = (x * 16807) % 2147483647;
    const j = x % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const tag = (s: string) =>
  "#" +
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

export async function getStudio(opts: {
  theme: StudioTheme;
  kind: StudioKind;
  countryId?: number;
  count: number;
  seed: number;
}): Promise<{ heading: string; items: StudioItem[]; caption: string; country: CountryChart | null; countries: CountryChart[] }> {
  const countries = (await getCountryCharts()).filter((c) => c.code);
  let country: CountryChart | null = null;
  if (opts.theme === "pays" || opts.theme === "affiche") {
    country = countries.find((c) => c.id === opts.countryId) ?? null;
    if (!country && opts.countryId !== -1) {
      const scope = await getTrendScope();
      country = scope.kind === "pays" ? scope.chart : null;
    }
  }
  const asAlbums = opts.kind === "albums";
  const word = asAlbums ? "albums" : "titres";
  let items: StudioItem[] = [];
  let heading = "";
  let tags: string[] = [];

  type Chart = { tracks: ChartTrack[]; albums: AlbumHit[] };
  const fromChart = (chart: Chart): StudioItem[] =>
    asAlbums
      ? chart.albums.map((a) => ({ kind: "album" as const, id: a.id, title: a.title, artist: a.artist }))
      : chart.tracks.map((t) => ({ kind: "titre" as const, id: t.id, title: t.title, artist: t.artist }));

  if (opts.theme === "pays" || opts.theme === "affiche") {
    const chart = country ? await lightChart(country.id) : await getChart(0);
    const where = country?.name ? inCountry(country.name) : "en France";
    items = opts.theme === "affiche" ? fromChart({ tracks: chart.tracks, albums: [] }) : fromChart(chart);
    heading =
      opts.theme === "affiche"
        ? `Top 10 du moment ${country?.name ? `· ${country.name}` : "· France"}`
        : `Top ${opts.count} des ${word} ${where} cette semaine`;
    tags = [country?.name ? tag(country.name) : "#france", "#top" + (opts.theme === "affiche" ? 10 : opts.count)];
  } else if (opts.theme === "monde") {
    items = fromChart(await lightChart(WORLD_PLAYLIST));
    heading = `Top ${opts.count} des ${word} dans le monde cette semaine`;
    tags = ["#topmonde", "#top" + opts.count];
  } else if (opts.theme === "notes") {
    items = (await getTopRatedAlbums(opts.count)).map((a) => ({
      kind: "album" as const,
      id: a.album_id,
      title: a.album_title,
      artist: a.artist_name,
    }));
    heading = `Les ${opts.count} albums les mieux notés sur Pépite`;
    tags = ["#avismusique", "#critique"];
  } else if (opts.theme === "sorties") {
    items = (await getNewReleases(opts.count)).map((a) => ({ kind: "album" as const, id: a.id, title: a.title, artist: a.artist }));
    heading = `${opts.count} sorties de la semaine à écouter`;
    tags = ["#nouveautes", "#nouvellesortie"];
  } else {
    // Au hasard : un mélange du top du pays, du Top Monde et des sorties.
    const scope = await getTrendScope();
    const [local, world, fresh] = await Promise.all([
      scope.kind === "pays" ? lightChart(scope.chart.id) : getChart(0),
      lightChart(WORLD_PLAYLIST),
      getNewReleases(20),
    ]);
    const pool = [
      ...fromChart(local),
      ...fromChart(world),
      ...(asAlbums ? fresh.map((a) => ({ kind: "album" as const, id: a.id, title: a.title, artist: a.artist })) : []),
    ];
    const seen = new Set<number>();
    items = shuffle(pool, opts.seed).filter((i) => !seen.has(i.id) && seen.add(i.id));
    heading = `${opts.count} ${word} à découvrir`;
    tags = ["#decouverte", "#pepite"];
  }

  items = items.slice(0, opts.theme === "affiche" ? 10 : opts.count);
  const caption = [
    `${heading} 🔥`,
    opts.theme === "affiche"
      ? "Le Top 10 du moment selon les classements Deezer. Lequel tu écoutes en boucle ? 👇"
      : "Lequel tu écoutes en boucle ? Dis-le en commentaire 👇",
    "Note-les et donne ton avis sur Pépite (lien en bio).",
    "",
    [...tags, "#musique", "#musiquetiktok", "#pepitemusic", "#fyp"].join(" "),
  ].join("\n");
  return { heading, items, caption, country, countries };
}
