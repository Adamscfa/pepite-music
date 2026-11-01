"use server";

import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export type ContactState = { error?: string; done?: boolean };

const TOPICS = ["question", "bug", "donnees", "signalement", "autre"];

// Enregistre le message ; il apparaît sur la page Modération.
export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Champ caché que seuls les robots remplissent.
  if (String(formData.get("site") ?? "")) return { done: true };
  const me = await getCurrentProfile();
  const topic = String(formData.get("topic") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  if (!TOPICS.includes(topic)) return { error: "Choisis un sujet." };
  if (!body) return { error: "Écris ton message." };
  if (body.length > 3000) return { error: "Ton message est trop long (3000 caractères max)." };
  if (!me && !email.includes("@")) return { error: "Laisse ton adresse e-mail pour qu'on puisse te répondre." };
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert({
    user_id: me?.id ?? null,
    name: name || me?.display_name || "",
    email,
    topic,
    body,
  });
  if (error) return { error: "L'envoi a échoué. Réessaie dans un instant." };
  return { done: true };
}
