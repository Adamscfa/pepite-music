import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";
import { hasSupabaseConfig } from "./supabase/config";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
};

export type Review = {
  id: number;
  album_id: number;
  album_title: string;
  artist_name: string;
  cover_url: string | null;
  release_year: number | null;
  rating: number;
  body: string;
  updated_at: string;
  profile: Pick<Profile, "username" | "display_name">;
};

const REVIEW_FIELDS =
  "id, album_id, album_title, artist_name, cover_url, release_year, rating, body, updated_at, profile:profiles!inner(username, display_name)";

// Le membre connecté et son profil, ou null. Mis en cache le temps d'une requête.
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  if (!hasSupabaseConfig) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio")
    .eq("id", userId)
    .maybeSingle();
  return profile;
});

export async function getRecentReviews(limit = 50): Promise<Review[]> {
  if (!hasSupabaseConfig) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(REVIEW_FIELDS)
    .order("updated_at", { ascending: false })
    .limit(limit)
    .returns<Review[]>();
  return data ?? [];
}

export async function getAlbumReviews(albumId: number): Promise<Review[]> {
  if (!hasSupabaseConfig) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(REVIEW_FIELDS)
    .eq("album_id", albumId)
    .order("updated_at", { ascending: false })
    .returns<Review[]>();
  return data ?? [];
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  if (!hasSupabaseConfig) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio")
    .eq("username", username)
    .maybeSingle();
  return data;
}

export async function getUserReviews(userId: string): Promise<Review[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(REVIEW_FIELDS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .returns<Review[]>();
  return data ?? [];
}
