"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

type VideoActionState = { error?: string; success?: string };

export async function reviewVideo(
  _previous: VideoActionState,
  formData: FormData,
): Promise<VideoActionState> {
  const me = await getCurrentProfile();
  if (!me?.is_admin) return { error: "Cette action est réservée aux administrateurs." };

  const id = formData.get("id");
  const decision = formData.get("decision");
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) {
    return { error: "Cette vidéo est invalide." };
  }
  if (decision !== "approved" && decision !== "rejected") {
    return { error: "Choix de validation invalide." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("video_queue")
    .update({
      status: decision,
      approved_by: decision === "approved" ? me.id : null,
      approved_at: decision === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) return { error: "Impossible de mettre à jour la vidéo. Réessaie." };
  if (!data) return { error: "Cette vidéo a déjà été traitée ou n'existe plus." };

  revalidatePath("/admin/videos");
  return { success: decision === "approved" ? "Vidéo approuvée." : "Vidéo refusée." };
}
