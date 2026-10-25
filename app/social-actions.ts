"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { areFriends, EMOJIS, getCurrentProfile, getProfileByUsername, weekStart } from "@/lib/data";
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

// ---- Réactions en emoji ----

export async function toggleReaction(reviewId: number, emoji: string, on: boolean) {
  const me = await getCurrentProfile();
  if (!me || !(EMOJIS as readonly string[]).includes(emoji)) return;
  const supabase = await createClient();
  if (on) await supabase.from("review_reactions").insert({ review_id: reviewId, user_id: me.id, emoji });
  else
    await supabase.from("review_reactions").delete().eq("review_id", reviewId).eq("user_id", me.id).eq("emoji", emoji);
  revalidatePath("/", "layout");
}

// ---- Signalements ----

const REASONS = ["spam", "mechant", "hors-sujet", "autre"];

export async function reportReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await getCurrentProfile();
  if (!me) return { error: LOGIN };
  const reason = String(formData.get("reason"));
  if (!REASONS.includes(reason)) return { error: "Choisis une raison." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .insert({ review_id: Number(formData.get("review_id")), user_id: me.id, reason });
  // 23505 : déjà signalé par ce membre, on le remercie quand même.
  if (error && error.code !== "23505") return { error: FAILED };
  revalidatePath("/", "layout");
  return { done: true };
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
  await supabase
    .from("review_comments")
    .delete()
    .eq("id", Number(formData.get("comment_id")))
    .eq("user_id", me.id);
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
  await supabase
    .from("favorites")
    .delete()
    .eq("user_id", me.id)
    .eq("position", Number(formData.get("position")));
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
  await supabase
    .from("lists")
    .delete()
    .eq("id", Number(formData.get("list_id")))
    .eq("user_id", me.id);
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

// ---- Messages privés et recommandations ----

export async function sendMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await getCurrentProfile();
  if (!me) return { error: LOGIN };
  const friend = await getProfileByUsername(String(formData.get("to") ?? ""));
  if (!friend || friend.id === me.id) return { error: "Choisis un ami." };
  if (!(await areFriends(me.id, friend.id))) {
    return { error: "Vous devez être amis : l'un de vous doit être abonné à l'autre." };
  }
  const body = String(formData.get("body") ?? "").trim();
  if (body.length > 1000) return { error: "Ton message est trop long (1000 caractères max)." };
  const albumId = Number(formData.get("album_id")) || null;
  const album = albumId ? await albumRef(albumId) : null;
  if (albumId && !album) return { error: FAILED };
  if (!body && !album) return { error: "Écris quelque chose avant d'envoyer." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("messages")
    .insert({ sender_id: me.id, recipient_id: friend.id, body, ...(album ?? {}) });
  if (error) return { error: FAILED };
  revalidatePath("/", "layout");
  return { done: true };
}

export async function markThreadRead(friendId: string) {
  const me = await getCurrentProfile();
  if (!me) return;
  const supabase = await createClient();
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", me.id)
    .eq("sender_id", friendId)
    .is("read_at", null);
  revalidatePath("/", "layout");
}

// ---- Notifications ----

export async function markNotificationsRead() {
  const me = await getCurrentProfile();
  if (!me) return;
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", me.id)
    .is("read_at", null);
  revalidatePath("/", "layout");
}

// ---- Pépite de la semaine ----

export async function voteWeekly(formData: FormData) {
  const me = await getCurrentProfile();
  if (!me) return;
  const supabase = await createClient();
  if (formData.get("remove") === "1") {
    await supabase.from("weekly_votes").delete().eq("user_id", me.id).eq("week", weekStart());
  } else {
    const album = await albumRef(Number(formData.get("album_id")));
    if (!album) return;
    // La semaine est remplie par la base (lundi en cours).
    await supabase.from("weekly_votes").upsert({ user_id: me.id, ...album }, { onConflict: "user_id,week" });
  }
  revalidatePath("/", "layout");
}
