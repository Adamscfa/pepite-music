import "server-only";
import { getTopRatedAlbums } from "./data";
import {
  getChart,
  getCountryCharts,
  getPlaylistChart,
  getNewReleases,
  getPlaylistTracks,
  type AlbumHit,
  type ChartTrack,
  WORLD_PLAYLIST,
  type CountryChart,
  type ArtistHit,
} from "./deezer";
import { getTrendScope } from "./trends";
import { inCountry } from "./country-names";

// Studio TikTok (réservé aux admins) : une série d'images verticales prêtes à poster
// en carrousel, avec le texte et les hashtags qui vont avec.

export type StudioTheme = "pays" | "monde" | "notes" | "sorties" | "hasard";
export type StudioKind = "albums" | "titres" | "artistes";
// cover : pochette (ou photo de l'artiste) en petite taille Deezer, utilisée par l'affiche.
export type StudioItem = { kind: "album" | "titre" | "artiste"; id: number; title: string; artist: string; cover: string };

// Titre de l'affiche Top 10 : une grande ligne (« TOP 10 TITRES ») et une petite
// (« CÔTE D'IVOIRE · CETTE SEMAINE »), plus la couleur de fond choisie d'après le pays.
export type StudioPoster = { title: string; place: string; color: PosterColor };

export const POSTER_COLORS = {
  vert: "#0B6B45",
  orange: "#D9590B",
  rouge: "#B3121B",
  bleu: "#1730A6",
  violet: "#4A23A0",
  rose: "#B0175E",
  noir: "#15181C",
} as const;
export type PosterColor = keyof typeof POSTER_COLORS;

// Couleur de l'affiche selon le pays, inspirée de son drapeau (sinon le vert Pépite).
const COUNTRY_COLORS: Record<string, PosterColor> = {
  CI: "orange", NE: "orange", IN: "orange", NL: "orange",
  SN: "vert", NG: "vert", CM: "vert", ML: "vert", GN: "vert", BF: "vert", GH: "vert", BR: "vert",
  DZ: "vert", SA: "vert", MX: "vert", IT: "vert", IE: "vert", PT: "vert",
  KE: "rouge", MA: "rouge", TN: "rouge", TR: "rouge", CA: "rouge", CH: "rouge", PE: "rouge", AT: "rouge",
  PL: "rouge", DK: "rouge", ES: "rouge", BE: "rouge", DE: "noir", EG: "rouge", JP: "rouge",
  ZA: "bleu", FR: "bleu", CD: "bleu", US: "bleu", GB: "bleu", AR: "bleu", GR: "bleu", FI: "bleu",
  SE: "bleu", AU: "bleu", NZ: "bleu", RW: "bleu", CO: "bleu", CL: "bleu", PH: "bleu", KR: "bleu",
};

export const THEMES: { id: StudioTheme; label: string }[] = [
  { id: "pays", label: "Top d'un pays" },
  { id: "monde", label: "Top Monde" },
  { id: "notes", label: "Les mieux notés sur Pépite" },
  { id: "sorties", label: "Sorties de la semaine" },
  { id: "hasard", label: "Au hasard" },
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
}): Promise<{
  heading: string;
  items: StudioItem[];
  caption: string;
  country: CountryChart | null;
  countries: CountryChart[];
  poster: StudioPoster;
}> {
  const countries = (await getCountryCharts()).filter((c) => c.code);
  let country: CountryChart | null = null;
  if (opts.theme === "pays") {
    country = countries.find((c) => c.id === opts.countryId) ?? null;
    if (!country && opts.countryId !== -1) {
      const scope = await getTrendScope();
      country = scope.kind === "pays" ? scope.chart : null;
    }
  }
  const asAlbums = opts.kind === "albums";
  const word = opts.kind === "albums" ? "albums" : opts.kind === "artistes" ? "artistes" : "titres";
  let items: StudioItem[] = [];
  let heading = "";
  let tags: string[] = [];

  type Chart = { tracks: ChartTrack[]; albums: AlbumHit[]; artists?: ArtistHit[] };
  const fromChart = (chart: Chart): StudioItem[] =>
    opts.kind === "artistes"
      ? (chart.artists ?? []).map((a) => ({ kind: "artiste" as const, id: a.id, title: a.name, artist: a.name, cover: a.picture }))
      : asAlbums
        ? chart.albums.map((a) => ({ kind: "album" as const, id: a.id, title: a.title, artist: a.artist, cover: a.cover }))
        : chart.tracks.map((t) => ({ kind: "titre" as const, id: t.id, title: t.title, artist: t.artist, cover: t.cover }));

  if (opts.theme === "pays") {
    const chart = country
      ? opts.kind === "artistes"
        ? await getPlaylistChart(country.id)
        : await lightChart(country.id)
      : await getChart(0);
    const where = country?.name ? inCountry(country.name) : "en France";
    items = fromChart(chart);
    heading = `Top ${opts.count} des ${word} ${where} cette semaine`;
    tags = [country?.name ? tag(country.name) : "#france", "#top" + opts.count];
  } else if (opts.theme === "monde") {
    const chart =
      opts.kind === "artistes" ? await getPlaylistChart(WORLD_PLAYLIST) : await lightChart(WORLD_PLAYLIST);
    items = fromChart(chart);
    heading = `Top ${opts.count} des ${word} dans le monde cette semaine`;
    tags = ["#topmonde", "#top" + opts.count];
  } else if (opts.theme === "notes") {
    items = (await getTopRatedAlbums(opts.count)).map((a) => ({
      kind: "album" as const,
      id: a.album_id,
      title: a.album_title,
      artist: a.artist_name,
      cover: a.cover_url ?? "",
    }));
    heading = `Les ${opts.count} albums les mieux notés sur Pépite`;
    tags = ["#avismusique", "#critique"];
  } else if (opts.theme === "sorties") {
    items = (await getNewReleases(opts.count)).map((a) => ({
      kind: "album" as const,
      id: a.id,
      title: a.title,
      artist: a.artist,
      cover: a.cover,
    }));
    heading = `${opts.count} sorties de la semaine à écouter`;
    tags = ["#nouveautes", "#nouvellesortie"];
  } else {
    // Au hasard : un mélange du top du pays, du Top Monde et des sorties.
    const scope = await getTrendScope();
    const [local, world, fresh] = await Promise.all([
      scope.kind === "pays"
        ? opts.kind === "artistes"
          ? getPlaylistChart(scope.chart.id)
          : lightChart(scope.chart.id)
        : getChart(0),
      opts.kind === "artistes" ? getPlaylistChart(WORLD_PLAYLIST) : lightChart(WORLD_PLAYLIST),
      getNewReleases(20),
    ]);
    const pool = [
      ...fromChart(local),
      ...fromChart(world),
      ...(asAlbums
        ? fresh.map((a) => ({ kind: "album" as const, id: a.id, title: a.title, artist: a.artist, cover: a.cover }))
        : []),
    ];
    const seen = new Set<number>();
    items = shuffle(pool, opts.seed).filter((i) => !seen.has(i.id) && seen.add(i.id));
    heading = `${opts.count} ${word} à découvrir`;
    tags = ["#decouverte", "#pepite"];
  }

  items = items.slice(0, opts.count);
  const caption = [
    `${heading} 🔥`,
    "Lequel tu écoutes en boucle ? Dis-le en commentaire 👇",
    "Note-les et donne ton avis sur Pépite (lien en bio).",
    "",
    [...tags, "#musique", "#musiquetiktok", "#pepitemusic", "#fyp"].join(" "),
  ].join("\n");
  const up = (s: string) => s.toLocaleUpperCase("fr");
  const n = items.length;
  const poster: StudioPoster =
    opts.theme === "pays"
      ? {
          title: `TOP ${n} ${up(word)}`,
          place: `${up(country?.name ?? "France")} · CETTE SEMAINE`,
          color: COUNTRY_COLORS[country?.code ?? "FR"] ?? "vert",
        }
      : opts.theme === "monde"
        ? { title: `TOP ${n} ${up(word)}`, place: "MONDE · CETTE SEMAINE", color: "violet" }
        : opts.theme === "notes"
          ? { title: `TOP ${n} PÉPITE`, place: "LES ALBUMS LES MIEUX NOTÉS", color: "vert" }
          : opts.theme === "sorties"
            ? { title: "NOUVEAUTÉS", place: "LES SORTIES DE LA SEMAINE", color: "rose" }
            : { title: `${n} PÉPITES`, place: `${up(word)} À DÉCOUVRIR`, color: "noir" };
  return { heading, items, caption, country, countries, poster };
}
