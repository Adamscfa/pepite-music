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
export type StudioCaptionLocale = "fr" | "en" | "es";
export const STUDIO_LOCALES: { id: StudioCaptionLocale; label: string }[] = [
  { id: "fr", label: "Français" },
  { id: "en", label: "English" },
  { id: "es", label: "Español" },
];
// cover : pochette (ou photo de l'artiste) en petite taille Deezer, utilisée par l'affiche.
export type StudioItem = { kind: "album" | "titre" | "artiste"; id: number; title: string; artist: string; cover: string };

// Titre de l'affiche Top 10 : une grande ligne (« TOP 10 TITRES ») et une petite
// (« CÔTE D'IVOIRE · CETTE SEMAINE »), plus la couleur de fond choisie d'après le pays.
export type StudioPoster = { title: string; place: string; footer: string; color: PosterColor };

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

const FRENCH_SPEAKING_COUNTRIES = new Set([
  "BE", "BJ", "BF", "BI", "CM", "CA", "CF", "TD", "KM", "CD", "CG", "CI", "DJ", "FR", "GA", "GN", "HT",
  "LU", "MG", "ML", "MC", "NE", "SN", "CH", "TG",
]);
const SPANISH_SPEAKING_COUNTRIES = new Set([
  "AR", "BO", "CL", "CO", "CR", "CU", "DO", "EC", "SV", "GQ", "GT", "HN", "MX", "NI", "PA", "PY", "PE",
  "ES", "UY", "VE",
]);

function captionLocale(country: CountryChart | null): StudioCaptionLocale {
  if (!country?.code) return "fr";
  if (FRENCH_SPEAKING_COUNTRIES.has(country.code)) return "fr";
  if (SPANISH_SPEAKING_COUNTRIES.has(country.code)) return "es";
  return "en";
}

export function isStudioCaptionLocale(value: string): value is StudioCaptionLocale {
  return value === "fr" || value === "en" || value === "es";
}

export function getStudioDuelLabels(locale: StudioCaptionLocale, kind: StudioKind) {
  const categories = {
    fr: { albums: "D'ALBUMS", titres: "DE SONS", artistes: "D'ARTISTES" },
    en: { albums: "OF ALBUMS", titres: "OF TRACKS", artistes: "OF ARTISTS" },
    es: { albums: "DE ÁLBUMES", titres: "DE CANCIONES", artistes: "DE ARTISTAS" },
  }[locale];
  const question = {
    fr: "Tu choisis qui ?",
    en: "Who do you choose?",
    es: "¿Con cuál te quedas?",
  }[locale];
  const vote = {
    fr: "Commente 1 ou 2",
    en: "Comment 1 or 2",
    es: "Comenta 1 o 2",
  }[locale];
  return { category: categories[kind], question, vote };
}

export function getStudioVideoHook(locale: StudioCaptionLocale, kind: StudioKind) {
  const phrases = {
    fr: { albums: "Quel album mérite", titres: "Quel son mérite", artistes: "Quel artiste mérite" },
    en: { albums: "Which album deserves", titres: "Which track deserves", artistes: "Which artist deserves" },
    es: { albums: "¿Qué álbum merece", titres: "¿Qué canción merece", artistes: "¿Qué artista merece" },
  }[locale];
  return phrases[kind];
}

function countryName(country: CountryChart | null, locale: StudioCaptionLocale) {
  if (!country?.code) return locale === "es" ? "Francia" : locale === "en" ? "France" : "France";
  return new Intl.DisplayNames([locale], { type: "region" }).of(country.code) ?? country.name ?? country.title;
}

function captionTitle(
  theme: StudioTheme,
  kind: StudioKind,
  count: number,
  heading: string,
  place: string,
  locale: StudioCaptionLocale,
) {
  if (locale === "fr") return heading;
  const noun = {
    en: { albums: "albums", titres: "tracks", artistes: "artists" },
    es: { albums: "álbumes", titres: "canciones", artistes: "artistas" },
    fr: { albums: "albums", titres: "titres", artistes: "artistes" },
  }[locale][kind];

  if (theme === "pays") {
    return locale === "en"
      ? `Top ${count} ${noun} in ${place} this week`
      : `Top ${count} ${noun} de ${place} esta semana`;
  }
  if (theme === "monde") {
    return locale === "en"
      ? `Top ${count} ${noun} worldwide this week`
      : `Top ${count} ${noun} del mundo esta semana`;
  }
  if (theme === "notes") return locale === "en"
    ? `The ${count} highest-rated albums on Pépite`
    : `Los ${count} álbumes mejor valorados en Pépite`;
  if (theme === "sorties") return locale === "en"
    ? `${count} new releases to listen to this week`
    : `${count} novedades para escuchar esta semana`;
  return locale === "en" ? `${count} ${noun} to discover` : `${count} ${noun} por descubrir`;
}

function captionTags(theme: StudioTheme, count: number, place: string, locale: StudioCaptionLocale) {
  const specific = theme === "pays"
    ? [tag(place), `#top${count}`]
    : theme === "monde"
      ? [locale === "en" ? "#worldtop" : locale === "es" ? "#topmundial" : "#topmonde", `#top${count}`]
      : theme === "notes"
        ? locale === "en" ? ["#musicreviews", "#albumreview"] : locale === "es" ? ["#criticasmusicales", "#albumes"] : ["#avismusique", "#critique"]
        : theme === "sorties"
          ? locale === "en" ? ["#newmusic", "#newreleases"] : locale === "es" ? ["#novedades", "#nuevoslanzamientos"] : ["#nouveautes", "#nouvellesortie"]
          : locale === "en" ? ["#discovermusic", "#pepite"] : locale === "es" ? ["#descubremusica", "#pepite"] : ["#decouverte", "#pepite"];
  const common = locale === "en"
    ? ["#music", "#musictiktok", "#pepitemusic", "#fyp"]
    : locale === "es"
      ? ["#musica", "#musictiktok", "#pepitemusic", "#fyp"]
      : ["#musique", "#musiquetiktok", "#pepitemusic", "#fyp"];
  return [...specific, ...common];
}

export function getStudioVideoCaption(
  mode: "duel" | "note",
  locale: StudioCaptionLocale,
  tags: string,
  duelQuestion?: string,
  duelVote?: string,
) {
  const lines = {
    fr: mode === "duel"
      ? [`Duel : ${duelQuestion ?? "Tu choisis qui ?"} ⚔️`, `${duelVote ?? "Commente 1 ou 2"} 👇`, "Note ta musique sur Pépite (lien en bio)."]
      : ["Lequel mérite 5 étoiles ? ⭐", "Donne ta note en commentaire 👇", "Note ta musique sur Pépite (lien en bio)."],
    en: mode === "duel"
      ? [`Duel: ${duelQuestion ?? "Who do you choose?"} ⚔️`, `${duelVote ?? "Comment 1 or 2"} 👇`, "Rate your music on Pépite (link in bio)."]
      : ["Which one deserves 5 stars? ⭐", "Leave your rating in the comments 👇", "Rate your music on Pépite (link in bio)."],
    es: mode === "duel"
      ? [`Duelo: ${duelQuestion ?? "¿Con cuál te quedas?"} ⚔️`, `${duelVote ?? "Comenta 1 o 2"} 👇`, "Puntúa tu música en Pépite (enlace en la bio)."]
      : ["¿Cuál merece 5 estrellas? ⭐", "Deja tu nota en los comentarios 👇", "Puntúa tu música en Pépite (enlace en la bio)."],
  }[locale];
  return [...lines, "", tags].join("\n");
}

export async function getStudio(opts: {
  theme: StudioTheme;
  kind: StudioKind;
  countryId?: number;
  count: number;
  seed: number;
  locale?: StudioCaptionLocale;
}): Promise<{
  heading: string;
  items: StudioItem[];
  caption: string;
  captionLocale: StudioCaptionLocale;
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
  } else if (opts.theme === "monde") {
    const chart =
      opts.kind === "artistes" ? await getPlaylistChart(WORLD_PLAYLIST) : await lightChart(WORLD_PLAYLIST);
    items = fromChart(chart);
    heading = `Top ${opts.count} des ${word} dans le monde cette semaine`;
  } else if (opts.theme === "notes") {
    items = (await getTopRatedAlbums(opts.count)).map((a) => ({
      kind: "album" as const,
      id: a.album_id,
      title: a.album_title,
      artist: a.artist_name,
      cover: a.cover_url ?? "",
    }));
    heading = `Les ${opts.count} albums les mieux notés sur Pépite`;
  } else if (opts.theme === "sorties") {
    items = (await getNewReleases(opts.count)).map((a) => ({
      kind: "album" as const,
      id: a.id,
      title: a.title,
      artist: a.artist,
      cover: a.cover,
    }));
    heading = `${opts.count} sorties de la semaine à écouter`;
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
  }

  items = items.slice(0, opts.count);
  const locale = opts.locale ?? captionLocale(country);
  const place = countryName(country, locale);
  const caption = [
    `${captionTitle(opts.theme, opts.kind, items.length, heading, place, locale)} 🔥`,
    locale === "en"
      ? "Which one is on repeat? Tell us in the comments 👇"
      : locale === "es"
        ? "¿Cuál estás escuchando en bucle? Cuéntanos en los comentarios 👇"
        : "Lequel tu écoutes en boucle ? Dis-le en commentaire 👇",
    locale === "en"
      ? "Rate them and share your thoughts on Pépite (link in bio)."
      : locale === "es"
        ? "Puntúalos y comparte tu opinión en Pépite (enlace en la bio)."
        : "Note-les et donne ton avis sur Pépite (lien en bio).",
    "",
    captionTags(opts.theme, items.length, place, locale).join(" "),
  ].join("\n");
  const up = (s: string) => s.toLocaleUpperCase("fr");
  const n = items.length;
  const posterNouns = {
    fr: { albums: "ALBUMS", titres: "TITRES", artistes: "ARTISTES" },
    en: { albums: "ALBUMS", titres: "TRACKS", artistes: "ARTISTS" },
    es: { albums: "ÁLBUMES", titres: "CANCIONES", artistes: "ARTISTAS" },
  }[locale];
  const week = { fr: "CETTE SEMAINE", en: "THIS WEEK", es: "ESTA SEMANA" }[locale];
  const footer = {
    fr: "Note-les sur Pépite",
    en: "Rate them on Pépite",
    es: "Puntúalos en Pépite",
  }[locale];
  const poster: StudioPoster =
    opts.theme === "pays"
      ? {
          title: `TOP ${n} ${posterNouns[opts.kind]}`,
          place: `${up(countryName(country, locale))} · ${week}`,
          footer,
          color: COUNTRY_COLORS[country?.code ?? "FR"] ?? "vert",
        }
      : opts.theme === "monde"
        ? {
            title: `TOP ${n} ${posterNouns[opts.kind]}`,
            place: `${{ fr: "MONDE", en: "WORLDWIDE", es: "MUNDO" }[locale]} · ${week}`,
            footer,
            color: "violet",
          }
        : opts.theme === "notes"
          ? {
              title: `TOP ${n} PÉPITE`,
              place: { fr: "LES ALBUMS LES MIEUX NOTÉS", en: "HIGHEST-RATED ALBUMS", es: "ÁLBUMES MEJOR VALORADOS" }[locale],
              footer,
              color: "vert",
            }
          : opts.theme === "sorties"
            ? {
                title: { fr: "NOUVEAUTÉS", en: "NEW RELEASES", es: "NOVEDADES" }[locale],
                place: {
                  fr: "LES SORTIES DE LA SEMAINE",
                  en: "THIS WEEK'S NEW MUSIC",
                  es: "NOVEDADES DE LA SEMANA",
                }[locale],
                footer,
                color: "rose",
              }
            : {
                title: `${n} ${posterNouns[opts.kind]}`,
                place: {
                  fr: `${up(word)} À DÉCOUVRIR`,
                  en: `${posterNouns[opts.kind]} TO DISCOVER`,
                  es: `${posterNouns[opts.kind]} POR DESCUBRIR`,
                }[locale],
                footer,
                color: "noir",
              };
  return { heading, items, caption, captionLocale: locale, country, countries, poster };
}
