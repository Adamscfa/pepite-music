import "server-only";
import { createClient } from "./supabase/server";

// Tableau de bord des admins : les membres inscrits et ce qu'ils font.
// Tout vient de tables déjà lisibles par tous (profils, avis, commentaires, abonnements) :
// aucun e-mail ni message privé.

export type Member = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_demo: boolean;
  onboarded: boolean | null;
  created_at: string;
  reviews: number;
  followers: number;
  following: number;
  lastActive: string | null;
};

const DAY = 86400000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export async function getDashboard() {
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * DAY).toISOString();
  const [profiles, reviews, comments, follows, totalReviews, totalComments] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, is_demo, onboarded, created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase.from("reviews").select("user_id, created_at").order("created_at", { ascending: false }).limit(20000),
    supabase.from("review_comments").select("user_id, created_at").gte("created_at", since).limit(20000),
    supabase.from("follows").select("follower_id, following_id").limit(50000),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
    supabase.from("review_comments").select("*", { count: "exact", head: true }),
  ]);

  type P = Omit<Member, "reviews" | "followers" | "following" | "lastActive">;
  const rows = (profiles.data ?? []) as P[];
  const reviewCount = new Map<string, number>();
  const last = new Map<string, string>();
  const touch = (id: string, at: string) => {
    if (!last.has(id) || last.get(id)! < at) last.set(id, at);
  };
  for (const r of reviews.data ?? []) {
    reviewCount.set(r.user_id, (reviewCount.get(r.user_id) ?? 0) + 1);
    touch(r.user_id, r.created_at);
  }
  for (const c of comments.data ?? []) touch(c.user_id, c.created_at);
  const followers = new Map<string, number>();
  const following = new Map<string, number>();
  for (const f of follows.data ?? []) {
    followers.set(f.following_id, (followers.get(f.following_id) ?? 0) + 1);
    following.set(f.follower_id, (following.get(f.follower_id) ?? 0) + 1);
  }

  const members: Member[] = rows.map((p) => ({
    ...p,
    is_demo: Boolean(p.is_demo),
    reviews: reviewCount.get(p.id) ?? 0,
    followers: followers.get(p.id) ?? 0,
    following: following.get(p.id) ?? 0,
    lastActive: last.get(p.id) ?? null,
  }));
  const real = members.filter((m) => !m.is_demo);
  const now = Date.now();
  const newer = (days: number) => real.filter((m) => now - Date.parse(m.created_at) < days * DAY).length;
  const activeWeek = real.filter((m) => m.lastActive && now - Date.parse(m.lastActive) < 7 * DAY).length;

  // Inscriptions par jour sur les 30 derniers jours (jours sans inscription compris).
  const perDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) perDay.set(dayKey(new Date(now - i * DAY)), 0);
  for (const m of real) {
    const k = m.created_at.slice(0, 10);
    if (perDay.has(k)) perDay.set(k, perDay.get(k)! + 1);
  }

  return {
    total: real.length,
    demo: members.length - real.length,
    today: real.filter((m) => m.created_at.slice(0, 10) === dayKey(new Date())).length,
    week: newer(7),
    month: newer(30),
    activeWeek,
    onboarded: real.filter((m) => m.onboarded).length,
    totalReviews: totalReviews.count ?? 0,
    totalComments: totalComments.count ?? 0,
    perDay: [...perDay.entries()].map(([day, count]) => ({ day, count })),
    latest: real.slice(0, 50),
    mostFollowed: [...real].sort((a, b) => b.followers - a.followers).filter((m) => m.followers > 0).slice(0, 10),
    mostActive: [...real].sort((a, b) => b.reviews - a.reviews).filter((m) => m.reviews > 0).slice(0, 10),
  };
}
