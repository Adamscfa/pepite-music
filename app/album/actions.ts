"use server";

import { revalidatePath } from "next/cache";
import { getAlbum, getTrack } from "@/lib/deezer";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

// "at" change à chaque publication pour rejouer la petite animation.
export type ReviewState = { error?: string; saved?: boolean; at?: number };

// Copie de l'album (ou de la chanson) relue chez Deezer plutôt que reçue du navigateur.
async function snapshot(albumId: number, trackId: number | null) {
  if (trackId) {
    const t = await getTrack(trackId);
    if (!t) return null;
    return {
      album_id: t.albumId,
      album_title: t.albumTitle,
      artist_name: t.artist,
      cover_url: t.coverSmall,
      release_year: t.year,
      track_id: t.id,
      track_title: t.title,
    };
  }
  const a = await getAlbum(albumId);
  if (!a) return null;
  return {
    album_id: a.id,
    album_title: a.title,
    artist_name: a.artist,
    cover_url: a.coverSmall,
    release_year: a.year,
    track_id: null,
    track_title: null,
  };
}

export async function saveReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const me = await getCurrentProfile();
  if (!me) return { error: "Connecte-toi pour noter." };

  const albumId = Number(formData.get("album_id"));
  const trackId = Number(formData.get("track_id")) || null;
  const rating = Number(formData.get("rating"));
  const body = String(formData.get("body") ?? "").trim();
  const heart = formData.get("heart") === "1";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Choisis une note de 1 à 5 étoiles." };
  if (body.length > 2000) return { error: "Ton avis est trop long (2000 caractères max)." };

  const item = await snapshot(albumId, trackId);
  if (!item) return { error: "Impossible de retrouver ce titre chez Deezer. Réessaie." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .upsert(
      { user_id: me.id, ...item, rating, body, heart, updated_at: new Date().toISOString() },
      { onConflict: "user_id,album_id,track_id" },
    );
  if (error) return { error: "L'enregistrement a échoué. Réessaie dans un instant." };

  revalidatePath("/", "layout");
  return { saved: true, at: Date.now() };
}

export async function deleteReview(formData: FormData) {
  const me = await getCurrentProfile();
  if (!me) return;
  const trackId = Number(formData.get("track_id")) || null;
  const supabase = await createClient();
  const query = supabase
    .from("reviews")
    .delete()
    .eq("user_id", me.id)
    .eq("album_id", Number(formData.get("album_id")));
  await (trackId ? query.eq("track_id", trackId) : query.is("track_id", null));
  revalidatePath("/", "layout");
}
