import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { siteUrl } from "@/lib/seo";

// Plan du site pour Google : les pages principales, chaque album et chaque titre noté
// sur Pépite, et les profils des vrais membres (pas les comptes « Démo »).
type Row = { album_id: number; track_id: number | null; updated_at: string; hidden?: boolean };
type ProfileRow = { username: string; is_demo?: boolean; created_at?: string };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = ["", "/classements", "/explorer", "/conditions", "/confidentialite", "/contact"].map(
    (path) => ({ url: `${siteUrl}${path}`, changeFrequency: "daily" as const, priority: path ? 0.6 : 1 }),
  );
  if (!hasSupabaseConfig) return pages;

  try {
    const supabase = await createClient();
    const [{ data: reviews }, { data: profiles }] = await Promise.all([
      supabase.from("reviews").select("*").order("updated_at", { ascending: false }).limit(10000).returns<Row[]>(),
      supabase.from("profiles").select("*").limit(5000).returns<ProfileRow[]>(),
    ]);

    // Une seule entrée par album ou titre, avec la date de son dernier avis.
    const albums = new Map<number, string>();
    const tracks = new Map<number, string>();
    for (const r of reviews ?? []) {
      if (r.hidden) continue;
      if (r.track_id) {
        if (!tracks.has(r.track_id)) tracks.set(r.track_id, r.updated_at);
      } else if (!albums.has(r.album_id)) albums.set(r.album_id, r.updated_at);
    }

    return [
      ...pages,
      ...[...albums].map(([id, date]) => ({
        url: `${siteUrl}/album/${id}`,
        lastModified: new Date(date),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...[...tracks].map(([id, date]) => ({
        url: `${siteUrl}/titre/${id}`,
        lastModified: new Date(date),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...(profiles ?? [])
        .filter((p) => p.username && !p.is_demo)
        .map((p) => ({
          url: `${siteUrl}/profil/${encodeURIComponent(p.username)}`,
          changeFrequency: "weekly" as const,
          priority: 0.4,
        })),
    ];
  } catch (error) {
    console.error("Plan du site : base inaccessible", error);
    return pages;
  }
}
