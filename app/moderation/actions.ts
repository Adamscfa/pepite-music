"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

// Toutes ces actions sont réservées aux administrateurs (vérifié ici et par la base).
async function admin() {
  const me = await getCurrentProfile();
  if (!me?.is_admin) return null;
  return createClient();
}

export async function setReviewHidden(formData: FormData) {
  const supabase = await admin();
  if (!supabase) return;
  await supabase
    .from("reviews")
    .update({ hidden: formData.get("hidden") === "1" })
    .eq("id", Number(formData.get("review_id")));
  revalidatePath("/", "layout");
}

export async function deleteReviewAsAdmin(formData: FormData) {
  const supabase = await admin();
  if (!supabase) return;
  await supabase.from("reviews").delete().eq("id", Number(formData.get("review_id")));
  revalidatePath("/", "layout");
}

// « Rien à signaler » : on efface les signalements et on réaffiche l'avis.
export async function dismissReports(formData: FormData) {
  const supabase = await admin();
  if (!supabase) return;
  const reviewId = Number(formData.get("review_id"));
  await supabase.from("reports").delete().eq("review_id", reviewId);
  await supabase.from("reviews").update({ hidden: false }).eq("id", reviewId);
  revalidatePath("/", "layout");
}

export async function clearErrors() {
  const supabase = await admin();
  if (!supabase) return;
  await supabase.from("errors").delete().gt("id", 0);
  revalidatePath("/moderation");
}
