"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { error?: string; saved?: boolean };

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const me = await getCurrentProfile();
  if (!me) return { error: "Connecte-toi d'abord." };

  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const photo = formData.get("avatar");
  if (!displayName || displayName.length > 40) return { error: "Le nom affiché doit faire 1 à 40 caractères." };
  if (bio.length > 200) return { error: "La bio est trop longue (200 caractères max)." };

  const supabase = await createClient();
  const changes: { display_name: string; bio: string; avatar_url?: string | null } = { display_name: displayName, bio };

  if (formData.get("remove_avatar") === "1") changes.avatar_url = null;

  if (photo instanceof File && photo.size > 0) {
    const ext = IMAGE_TYPES[photo.type];
    if (!ext) return { error: "La photo doit être en JPG, PNG, WebP ou GIF." };
    if (photo.size > 2 * 1024 * 1024) return { error: "La photo est trop lourde (2 Mo max)." };
    // Un nom de fichier nouveau à chaque fois, pour que les navigateurs ne gardent pas l'ancienne en mémoire.
    const path = `${me.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, photo, { contentType: photo.type });
    if (error) return { error: "L'envoi de la photo a échoué. Réessaie dans un instant." };
    changes.avatar_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase.from("profiles").update(changes).eq("id", me.id);
  if (error) return { error: "L'enregistrement a échoué. Réessaie dans un instant." };

  // On supprime l'ancienne photo une fois la nouvelle enregistrée.
  if (changes.avatar_url !== undefined && me.avatar_url) {
    const old = me.avatar_url.split("/avatars/")[1];
    if (old) await supabase.storage.from("avatars").remove([old]);
  }

  revalidatePath("/", "layout");
  return { saved: true };
}
