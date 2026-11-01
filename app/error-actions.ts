"use server";

import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

// Note une erreur dans la table « errors » (visible sur la page Modération).
export async function logError(info: { message: string; digest?: string; path?: string }) {
  try {
    const me = await getCurrentProfile();
    const supabase = await createClient();
    await supabase.from("errors").insert({
      message: String(info.message || "Erreur inconnue").slice(0, 1000),
      digest: info.digest ? String(info.digest).slice(0, 100) : null,
      path: info.path ? String(info.path).slice(0, 300) : null,
      user_id: me?.id ?? null,
    });
  } catch {
    // Si même l'enregistrement échoue, on n'insiste pas.
  }
}
