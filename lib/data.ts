import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";
import { hasSupabaseConfig } from "./supabase/config";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
};

export type Author = Pick<Profile, "username" | "display_name" | "avatar_url">;

export type Review = {
  id: number;
  user_id: string;
  album_id: number;
  album_title: string;
  artist_name: string;
  cover_url: string | null;
  release_year: number | null;
  rating: number;
  body: string;
  updated_at: string;
  profile: Author;
  likes: number;
  liked: boolean;
  comments: number;
};

export type Comment = {
  id: number;
  body: string;
  created_at: string;
  user_id: string;
  profile: Author;
};

export type AlbumRef = {
  album_id: number;
  album_title: string;
  artist_name: string;
  cover_url: string | null;
};

export type Favorite = AlbumRef & { position: number };

export type List = {
  id: number;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
  items: (AlbumRef & { added_at: string })[];
};

// "*" plutôt qu'une liste de colonnes : la page marche même si une colonne manque encore.
const REVIEW_FIELDS = "*, profile:profiles!reviews_user_id_fkey!inner(*)";

type RawReview = Omit<Review, "likes" | "liked" | "comments" | "profile"> & { profile: Profile };

const author = (p: Profile): Author => ({
  username: p.username,
  display_name: p.display_name,
  avatar_url: p.avatar_url ?? null,
});

// Le membre connecté et son profil, ou null. Mis en cache le temps d'une requête.
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  if (!hasSupabaseConfig) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return profile ? { ...profile, avatar_url: profile.avatar_url ?? null } : null;
});

// Ajoute à chaque avis son nombre de « j'aime » et de commentaires.
// Requêtes séparées : si ces tables n'existent pas encore, les avis s'affichent quand même.
async function withSocial(raw: RawReview[] | null): Promise<Review[]> {
  const reviews = raw ?? [];
  if (!reviews.length) return [];
  const supabase = await createClient();
  const ids = reviews.map((r) => r.id);
  const [me, likes, comments] = await Promise.all([
    getCurrentProfile(),
    supabase.from("review_likes").select("review_id, user_id").in("review_id", ids),
    supabase.from("review_comments").select("review_id").in("review_id", ids),
  ]);
  return reviews.map((r) => {
    const mine = (likes.data ?? []).filter((l) => l.review_id === r.id);
    return {
      ...r,
      profile: author(r.profile),
      likes: mine.length,
      liked: Boolean(me && mine.some((l) => l.user_id === me.id)),
      comments: (comments.data ?? []).filter((c) => c.review_id === r.id).length,
    };
  });
}

export async function getRecentReviews({ followedBy }: { followedBy?: string } = {}): Promise<Review[]> {
  if (!hasSupabaseConfig) return [];
  const supabase = await createClient();
  let query = supabase.from("reviews").select(REVIEW_FIELDS).order("updated_at", { ascending: false }).limit(50);
  if (followedBy) {
    const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", followedBy);
    const ids = (follows ?? []).map((f) => f.following_id);
    if (!ids.length) return [];
    query = query.in("user_id", ids);
  }
  const { data } = await query.returns<RawReview[]>();
  return withSocial(data);
}

export async function getAlbumReviews(albumId: number): Promise<Review[]> {
  if (!hasSupabaseConfig) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(REVIEW_FIELDS)
    .eq("album_id", albumId)
    .order("updated_at", { ascending: false })
    .returns<RawReview[]>();
  return withSocial(data);
}

export async function getUserReviews(userId: string): Promise<Review[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(REVIEW_FIELDS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .returns<RawReview[]>();
  return withSocial(data);
}

export const getReview = cache(async (id: number): Promise<Review | null> => {
  if (!hasSupabaseConfig) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("reviews").select(REVIEW_FIELDS).eq("id", id).returns<RawReview[]>();
  const [review] = await withSocial(data);
  return review ?? null;
});

export async function getComments(reviewId: number): Promise<Comment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("review_comments")
    .select("id, body, created_at, user_id, profile:profiles!inner(*)")
    .eq("review_id", reviewId)
    .order("created_at", { ascending: true })
    .returns<(Omit<Comment, "profile"> & { profile: Profile })[]>();
  return (data ?? []).map((c) => ({ ...c, profile: author(c.profile) }));
}

export const getProfileByUsername = cache(async (username: string): Promise<Profile | null> => {
  if (!hasSupabaseConfig) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
  return data ? { ...data, avatar_url: data.avatar_url ?? null } : null;
});

export async function getFavorites(userId: string): Promise<Favorite[]> {
  if (!hasSupabaseConfig) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("favorites").select("*").eq("user_id", userId).order("position");
  return data ?? [];
}

export async function getFollowStats(userId: string, meId?: string) {
  const supabase = await createClient();
  const [followers, following, mine] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
    meId
      ? supabase.from("follows").select("follower_id").eq("follower_id", meId).eq("following_id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return { followers: followers.count ?? 0, following: following.count ?? 0, iFollow: Boolean(mine.data) };
}

const LIST_FIELDS = "*, items:list_items(album_id, album_title, artist_name, cover_url, added_at)";

const sortItems = (list: List): List => ({
  ...list,
  items: [...list.items].sort((a, b) => a.added_at.localeCompare(b.added_at)),
});

export async function getUserLists(userId: string): Promise<List[]> {
  if (!hasSupabaseConfig) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("lists")
    .select(LIST_FIELDS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<List[]>();
  return (data ?? []).map(sortItems);
}

export const getList = cache(async (id: number): Promise<(List & { owner: Author }) | null> => {
  if (!hasSupabaseConfig) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("lists")
    .select(`${LIST_FIELDS}, owner:profiles!inner(*)`)
    .eq("id", id)
    .returns<(List & { owner: Profile })[]>();
  const list = data?.[0];
  return list ? { ...sortItems(list), owner: author(list.owner) } : null;
});
