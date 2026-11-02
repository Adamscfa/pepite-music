import "server-only";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { author, tally, weekStart, type Contributor, type Profile, type WeeklyAlbum } from "./data";
import { hasSupabaseConfig, supabaseKey, supabaseUrl } from "./supabase/config";
import { getTrends, type Trends } from "./trends";

// Les blocs communs de l'accueil (tendances, top contributeurs, Pépite de la semaine,
// nombre d'avis) : préparés UNE fois par visite pour la colonne de droite et les bandeaux
// du téléphone, et gardés 5 minutes pour tout le monde. Ils ne dépendent pas du visiteur,
// donc on les lit sans sa session (comme un visiteur sans compte).

const KEEP = 300; // secondes

const anon = () => createAnonClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

const REVIEW_AUTHORS = "*, profile:profiles!reviews_user_id_fkey!inner(*)";

const topContributors = unstable_cache(
  async (): Promise<Contributor[]> => {
    if (!hasSupabaseConfig) return [];
    const { data } = await anon()
      .from("reviews")
      .select(REVIEW_AUTHORS)
      .order("updated_at", { ascending: false })
      .limit(3000)
      .returns<{ user_id: string; hidden?: boolean; profile: Profile }[]>();
    const byUser = new Map<string, Contributor>();
    for (const r of data ?? []) {
      if (r.hidden || !r.profile) continue;
      const c = byUser.get(r.user_id) ?? { ...author(r.profile), count: 0 };
      c.count += 1;
      byUser.set(r.user_id, c);
    }
    return [...byUser.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  },
  ["accueil-contributeurs"],
  { revalidate: KEEP },
);

const weekly = unstable_cache(
  async (week: string, lastWeek: string): Promise<{ current: WeeklyAlbum[]; lastWinner: WeeklyAlbum | null }> => {
    if (!hasSupabaseConfig) return { current: [], lastWinner: null };
    const db = anon();
    const [thisWeek, previous] = await Promise.all([
      db.from("weekly_votes").select("*").eq("week", week),
      db.from("weekly_votes").select("*").eq("week", lastWeek),
    ]);
    return { current: tally(thisWeek.data ?? []), lastWinner: tally(previous.data ?? [])[0] ?? null };
  },
  ["accueil-pepite-semaine"],
  { revalidate: KEEP },
);

// Nombre d'avis par album ou par titre (en liste de paires : une Map ne se garde pas).
const counts = unstable_cache(
  async (column: "album_id" | "track_id", ids: number[]): Promise<[number, number][]> => {
    if (!hasSupabaseConfig || !ids.length) return [];
    const { data } = await anon().from("reviews").select(column).in(column, ids);
    const out = new Map<number, number>();
    for (const r of (data ?? []) as Record<string, number>[]) out.set(r[column], (out.get(r[column]) ?? 0) + 1);
    return [...out.entries()];
  },
  ["accueil-compteurs"],
  { revalidate: KEEP },
);

// Les tendances du visiteur (selon son pays) : partagées par le bandeau du haut,
// la colonne de droite et les bandeaux du téléphone.
export const getHomeTrends = cache(() => getTrends(10));

export type HomeExtras = {
  trends: Trends;
  contributors: Contributor[];
  weekly: { current: WeeklyAlbum[]; lastWinner: WeeklyAlbum | null };
  albumCounts: Map<number, number>;
  trackCounts: Map<number, number>;
};

// cache() : si la colonne de droite et les bandeaux du téléphone le demandent tous les
// deux pendant la même visite, le travail n'est fait qu'une fois.
export const getHomeExtras = cache(async (): Promise<HomeExtras> => {
  const [trends, contributors, week] = await Promise.all([
    getHomeTrends(),
    topContributors(),
    weekly(weekStart(), weekStart(1)),
  ]);
  const [albumCounts, trackCounts] = await Promise.all([
    counts(
      "album_id",
      trends.albums.map((a) => a.id),
    ),
    counts(
      "track_id",
      trends.tracks.map((t) => t.id),
    ),
  ]);
  return {
    trends,
    contributors,
    weekly: week,
    albumCounts: new Map(albumCounts),
    trackCounts: new Map(trackCounts),
  };
});
