"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { isLocale, t } from "@/lib/i18n";

export type ProfileState = { error?: string; saved?: boolean };

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const localeValue = String(formData.get("locale") ?? "");
  const locale = isLocale(localeValue) ? localeValue : "fr";
  const me = await getCurrentProfile();
  if (!me) return { error: t(locale, "loginRequired") };

  const changes: { display_name?: string; bio?: string; avatar_url?: string | null } = {};
  let usernameChanged = false;
  if (formData.has("username")) {
    const username = String(formData.get("username") ?? "").trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,20}$/.test(username)) {
      return { error: t(locale, "invalidUsername") };
    }
    if (username !== me.username) {
      const supabase = await createClient();
      const { data: changed, error } = await supabase.rpc("change_my_username", { new_username: username });
      if (error) {
        if (error.code === "PGRST202" || error.code === "42883" || error.code === "42P01") {
          return { error: t(locale, "usernameMigrationRequired") };
        }
        return { error: t(locale, "usernameSaveFailed") };
      }
      if (changed !== true) return { error: t(locale, "usernameUnavailable") };
      usernameChanged = true;
    }
  }

  if (formData.has("display_name")) {
    const displayName = String(formData.get("display_name") ?? "").trim();
    if (!displayName || displayName.length > 40) return { error: t(locale, "invalidName") };
    changes.display_name = displayName;
  }
  if (formData.has("bio")) {
    const bio = String(formData.get("bio") ?? "").trim();
    if (bio.length > 200) return { error: t(locale, "bioTooLong") };
    changes.bio = bio;
  }

  const photo = formData.get("avatar");
  const supabase = await createClient();
  if (formData.get("remove_avatar") === "1") changes.avatar_url = null;

  let uploadedPath: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    const ext = IMAGE_TYPES[photo.type];
    if (!ext) return { error: t(locale, "invalidPhoto") };
    if (photo.size > 2 * 1024 * 1024) return { error: t(locale, "photoTooLarge") };
    // Un nom de fichier nouveau à chaque fois, pour que les navigateurs ne gardent pas l'ancienne en mémoire.
    const path = `${me.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, photo, { contentType: photo.type });
    if (error) return { error: t(locale, "photoUploadFailed") };
    uploadedPath = path;
    changes.avatar_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  if (!Object.keys(changes).length && !usernameChanged) return { error: t(locale, "noProfileChanges") };

  if (Object.keys(changes).length) {
    const { error } = await supabase.from("profiles").update(changes).eq("id", me.id);
    if (error) {
      if (uploadedPath) await supabase.storage.from("avatars").remove([uploadedPath]);
      return { error: t(locale, "profileSaveFailed") };
    }
  }

  // On supprime l'ancienne photo une fois la nouvelle enregistrée.
  if (changes.avatar_url !== undefined && me.avatar_url) {
    const old = me.avatar_url.split("/avatars/")[1];
    if (old) await supabase.storage.from("avatars").remove([old]);
  }

  revalidatePath("/", "layout");
  return { saved: true };
}

// Supprime le compte et tout ce que le membre a publié (fichier 10 nécessaire).
// Il faut retaper son pseudo pour confirmer.
export async function deleteAccount(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const me = await getCurrentProfile();
  if (!me) return { error: "Connecte-toi d'abord." };
  if (String(formData.get("confirm") ?? "").trim().toLowerCase() !== me.username) {
    return { error: "Tape exactement ton pseudo pour confirmer." };
  }
  const supabase = await createClient();
  // Les photos de profil d'abord (elles ne partent pas toutes seules).
  const { data: files } = await supabase.storage.from("avatars").list(me.id);
  if (files?.length) await supabase.storage.from("avatars").remove(files.map((f) => `${me.id}/${f.name}`));
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: "La suppression a échoué. Réessaie, ou écris-nous depuis la page Contact." };
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/?compte=supprime");
}
