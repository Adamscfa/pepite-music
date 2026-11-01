"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

// Étape 1 : les genres préférés (de 1 à 5).
export async function saveGenres(formData: FormData) {
  const me = await getCurrentProfile();
  if (!me) redirect("/connexion");
  const genres = formData
    .getAll("genre")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 5);
  if (genres.length) {
    const supabase = await createClient();
    await supabase.from("profiles").update({ favorite_genres: genres }).eq("id", me.id);
  }
  redirect("/bienvenue?etape=2");
}

// Fin du premier pas : on ne le reproposera plus.
export async function finishOnboarding() {
  const me = await getCurrentProfile();
  if (!me) redirect("/connexion");
  const supabase = await createClient();
  await supabase.from("profiles").update({ onboarded: true }).eq("id", me.id);
  revalidatePath("/", "layout");
  redirect("/");
}
