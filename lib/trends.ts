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
import { inCountry } from "./country-names";

// Classements et tendances « de chez toi » :
// 1. le choix fait sur la page Classements (cookie « top_pays », posé par proxy.ts) ;
// 2. sinon le pays du visiteur, donné par Vercel d'après son adresse internet ;
// 3. sinon la France (les classements Deezer par défaut).
export type TrendScope =
  | { kind: "pays"; chart: CountryChart; name: string }
  | { kind: "monde" }
  | { kind: "france" };

const countryName = (chart: CountryChart) => chart.name ?? chart.title.replace(/^top\s+/i, "");

// Le « Top <pays> » de Deezer pour un code pays (CI, SN, CM…), s'il existe.
// S'il y en a plusieurs (« Top Bulgarie » et « Top Bulgarie 2025 »), le plus simple.
function chartForCode(code: string, countries: CountryChart[]): CountryChart | null {
  const found = countries.filter((c) => c.code === code.toUpperCase());
  return found.sort((a, b) => a.title.length - b.title.length)[0] ?? null;
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
        label: scope.kind === "monde" ? "dans le monde" : inCountry(scope.name),
        tracks: tracks.slice(0, limit),
        albums: albumsFromTracks(tracks, limit),
      };
    }
  }
  const [tracks, albums] = await Promise.all([getTopTracks(limit), getTopAlbums(limit)]);
  return { label: "en France", tracks, albums };
}
