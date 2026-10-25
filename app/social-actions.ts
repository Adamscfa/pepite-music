"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";
import { getAlbum } from "@/lib/deezer";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; done?: boolean };

const LOGIN = "Connecte-toi d'abord.";
const FAILED = "Ça n'a pas marché. Réessaie dans un instant.";

// Copie des infos d'un album, relues chez Deezer plutôt que reçues du navigateur.
async function albumRef(albumId: number) {
  const album = await getAlbum(albumId);
  if (!album) return null;
  return { album_id: album.id, album_title: album.title, artist_name: album.artist, cover_url: album.coverSmall };
}

// ---- J'aime ----

export async function toggleLike(reviewId: number, like: boolean) {
  const me = await getCurrentProfile();
  if (!me) return;
  const supabase = await createClient();
  if (like) await supabase.from("review_likes").insert({ review_id: reviewId, user_id: me.id });
  else await supabase.from("review_likes").delete().eq("review_id", reviewId).eq("user_id", me.id);
  revalidatePath("/", "layout");
}

// ---- Commentaires ----

export async function addComment(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await getCurrentProfile();
  if (!me) return { error: LOGIN };
  const reviewId = Number(formData.get("review_id"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Écris quelque chose avant d'envoyer." };
  if (body.length > 500) return { error: "Ton commentaire est trop long (500 caractères max)." };
  const supabase = await createClient();
  const { error } = await supabase.from("review_comments").insert({ review_id: reviewId, user_id: me.id, body });
  if (error) return { error: FAILED };
  revalidatePath("/", "layout");
  return { done: true };
}

export async function deleteComment(formData: FormData) {
  const me = await getCurrentProfile();
  if (!me) return;
  const supabase = await createClient();
  await supabase.from("review_comments").delete().eq("id", Number(formData.get("comment_id"))).eq("user_id", me.id);
  revalidatePath("/", "layout");
}

// ---- Abonnements ----

export async function toggleFollow(formData: FormData) {
  const me = await getCurrentProfile();
  if (!me) return;
  const target = String(formData.get("user_id"));
  if (target === me.id) return;
  const supabase = await createClient();
  if (formData.get("follow") === "1") {
    await supabase.from("follows").insert({ follower_id: me.id, following_id: target });
  } else {
    await supabase.from("follows").delete().eq("follower_id", me.id).eq("following_id", target);
  }
  revalidatePath("/", "layout");
}

// ---- Favoris ----

export async function addFavorite(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await getCurrentProfile();
  if (!me) return { error: LOGIN };
  const supabase = await createClient();
  const { data: current } = await supabase.from("favorites").select("position, album_id").eq("user_id", me.id);
  const taken = (current ?? []).map((f) => f.position);
  const albumId = Number(formData.get("album_id"));
  if ((current ?? []).some((f) => f.album_id === albumId)) return { error: "Cet album est déjà dans tes favoris." };
  const position = [1, 2, 3, 4].find((p) => !taken.includes(p));
  if (!position) return { error: "Tu as déjà 4 favoris. Retire-en un depuis ton profil." };
  const album = await albumRef(albumId);
  if (!album) return { error: FAILED };
  const { error } = await supabase.from("favorites").insert({ user_id: me.id, position, ...album });
  if (error) return { error: FAILED };
  revalidatePath("/", "layout");
  return { done: true };
}

export async function removeFavorite(formData: FormData) {
  const me = await getCurrentProfile();
  if (!me) return;
  const supabase = await createClient();
  await supabase.from("favorites").delete().eq("user_id", me.id).eq("position", Number(formData.get("position")));
  revalidatePath("/", "layout");
}

// ---- Listes ----

export async function createList(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await getCurrentProfile();
  if (!me) return { error: LOGIN };
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title || title.length > 80) return { error: "Le titre doit faire 1 à 80 caractères." };
  if (description.length > 300) return { error: "La description est trop longue (300 caractères max)." };
  const supabase = await createClient();
  const { error } = await supabase.from("lists").insert({ user_id: me.id, title, description });
  if (error) return { error: FAILED };
  revalidatePath("/", "layout");
  return { done: true };
}

export async function deleteList(formData: FormData) {
  const me = await getCurrentProfile();
  if (!me) return;
  const supabase = await createClient();
  await supabase.from("lists").delete().eq("id", Number(formData.get("list_id"))).eq("user_id", me.id);
  revalidatePath("/", "layout");
  redirect(`/profil/${me.username}`);
}

export async function addToList(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await getCurrentProfile();
  if (!me) return { error: LOGIN };
  const listId = Number(formData.get("list_id"));
  if (!listId) return { error: "Choisis une liste." };
  const album = await albumRef(Number(formData.get("album_id")));
  if (!album) return { error: FAILED };
  const supabase = await createClient();
  // La sécurité de la base refuse si la liste n'est pas à ce membre.
  const { error } = await supabase.from("list_items").insert({ list_id: listId, ...album });
  if (error) return { error: error.code === "23505" ? "Cet album est déjà dans cette liste." : FAILED };
  revalidatePath("/", "layout");
  return { done: true };
}

export async function removeFromList(formData: FormData) {
  const me = await getCurrentProfile();
  if (!me) return;
  const supabase = await createClient();
  await supabase
    .from("list_items")
    .delete()
    .eq("list_id", Number(formData.get("list_id")))
    .eq("album_id", Number(formData.get("album_id")));
  revalidatePath("/", "layout");
}
