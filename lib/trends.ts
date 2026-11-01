import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import {
  getCountryCharts,
  getPlaylistTracks,
  getTopAlbums,
  getTopTracks,
  getWorldTopTracks,
  type AlbumHit,
  type ChartTrack,
  type CountryChart,
} from "./deezer";

// Classements et tendances « de chez toi » :
// 1. le choix fait sur la page Classements (cookie « top_pays », posé par proxy.ts) ;
// 2. sinon le pays du visiteur, donné par Vercel d'après son adresse internet ;
// 3. sinon la France (les classements Deezer par défaut).
export type TrendScope =
  | { kind: "pays"; chart: CountryChart; name: string }
  | { kind: "monde" }
  | { kind: "france" };

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’'`-]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

// Autres noms possibles d'un pays dans les titres Deezer.
const ALIASES: Record<string, string[]> = {
  CI: ["ivory coast", "cote d ivoire", "cote divoire"],
  CD: ["rdc", "congo", "dr congo", "drc"],
  US: ["usa", "etats unis", "united states"],
  GB: ["uk", "royaume uni", "united kingdom"],
  AE: ["emirats arabes unis", "uae"],
};

const countryName = (chart: CountryChart) => chart.title.replace(/^top\s+/i, "");

// Le « Top <pays> » de Deezer qui correspond à un code pays (CI, SN, CM…), s'il existe.
function chartForCode(code: string, countries: CountryChart[]): CountryChart | null {
  const names = ["fr", "en"]
    .map((lang) => {
      try {
        return new Intl.DisplayNames([lang], { type: "region" }).of(code.toUpperCase()) ?? "";
      } catch {
        return "";
      }
    })
    .filter(Boolean)
    .map(norm)
    .concat(ALIASES[code.toUpperCase()] ?? []);
  if (!names.length) return null;
  // Titre exact « Top <pays> », ou suivi d'une précision (« Top Congo (RDC) »), jamais un autre pays
  // qui commence pareil (Niger ≠ Nigeria).
  return (
    countries.find((c) => names.some((n) => norm(c.title) === `top ${n}`)) ??
    countries.find((c) => names.some((n) => norm(c.title).startsWith(`top ${n} `))) ??
    null
  );
}

export const getTrendScope = cache(async (): Promise<TrendScope> => {
  const countries = await getCountryCharts();
  const choice = (await cookies()).get("top_pays")?.value;
  if (choice === "monde") return { kind: "monde" };
  if (choice === "france") return { kind: "france" };
  if (choice) {
    const chart = countries.find((c) => String(c.id) === choice);
    if (chart) return { kind: "pays", chart, name: countryName(chart) };
  }
  const code = (await headers()).get("x-vercel-ip-country");
  if (code && code.toUpperCase() !== "FR") {
    const chart = chartForCode(code, countries);
    if (chart) return { kind: "pays", chart, name: countryName(chart) };
  }
  return { kind: "france" };
});

// Les albums dont viennent ces titres, sans doublon, dans l'ordre du classement.
function albumsFromTracks(tracks: ChartTrack[], limit: number): AlbumHit[] {
  const seen = new Set<number>();
  const albums: AlbumHit[] = [];
  for (const t of tracks) {
    if (seen.has(t.albumId)) continue;
    seen.add(t.albumId);
    albums.push({ id: t.albumId, title: t.albumTitle, artist: t.artist, cover: t.cover });
    if (albums.length >= limit) break;
  }
  return albums;
}

export type Trends = { label: string; tracks: ChartTrack[]; albums: AlbumHit[] };

// Titres et albums tendance pour le visiteur (ou pour son choix).
export async function getTrends(limit = 10): Promise<Trends> {
  const scope = await getTrendScope();
  if (scope.kind !== "france") {
    const tracks = scope.kind === "monde" ? await getWorldTopTracks() : await getPlaylistTracks(scope.chart.id);
    if (tracks.length) {
      return {
        label: scope.kind === "monde" ? "dans le monde" : `en ${scope.name}`,
        tracks: tracks.slice(0, limit),
        albums: albumsFromTracks(tracks, limit),
      };
    }
  }
  const [tracks, albums] = await Promise.all([getTopTracks(limit), getTopAlbums(limit)]);
  return { label: "en France", tracks, albums };
}
