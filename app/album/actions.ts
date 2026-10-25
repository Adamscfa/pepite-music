"use server";

import { revalidatePath } from "next/cache";
import { getAlbum } from "@/lib/deezer";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export type ReviewState = { error?: string; saved?: boolean };

export async function saveReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const me = await getCurrentProfile();
  if (!me) return { error: "Connecte-toi pour noter cet album." };

  const albumId = Number(formData.get("album_id"));
  const rating = Number(formData.get("rating"));
  const body = String(formData.get("body") ?? "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Choisis une note de 1 à 5 étoiles." };
  if (body.length > 2000) return { error: "Ton avis est trop long (2000 caractères max)." };

  // On relit l'album chez Deezer plutôt que de faire confiance au navigateur.
  const album = await getAlbum(albumId);
  if (!album) return { error: "Impossible de retrouver cet album chez Deezer. Réessaie." };

  const supabase = await createClient();
  const { error } = await supabase.from("reviews").upsert(
    {
      user_id: me.id,
      album_id: album.id,
      album_title: album.title,
      artist_name: album.artist,
      cover_url: album.coverSmall,
      release_year: album.year,
      rating,
      body,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,album_id" },
  );
  if (error) return { error: "L'enregistrement a échoué. Réessaie dans un instant." };

  revalidatePath("/", "layout");
  return { saved: true };
}

export async function deleteReview(formData: FormData) {
  const me = await getCurrentProfile();
  if (!me) return;
  const supabase = await createClient();
  await supabase
    .from("reviews")
    .delete()
    .eq("user_id", me.id)
    .eq("album_id", Number(formData.get("album_id")));
  revalidatePath("/", "layout");
}
