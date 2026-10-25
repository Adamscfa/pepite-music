"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { error?: string; saved?: boolean };

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const me = await getCurrentProfile();
  if (!me) return { error: "Connecte-toi d'abord." };

  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  if (!displayName || displayName.length > 40) return { error: "Le nom affiché doit faire 1 à 40 caractères." };
  if (bio.length > 200) return { error: "La bio est trop longue (200 caractères max)." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, bio })
    .eq("id", me.id);
  if (error) return { error: "L'enregistrement a échoué. Réessaie dans un instant." };

  revalidatePath("/", "layout");
  return { saved: true };
}
