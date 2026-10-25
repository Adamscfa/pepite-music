"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export type AuthState = { error?: string; message?: string };

const NOT_CONFIGURED = "Supabase n'est pas encore branché (voir le README).";

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!hasSupabaseConfig) return { error: NOT_CONFIGURED };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Confirme d'abord ton adresse avec le lien reçu par e-mail." };
    }
    return { error: "E-mail ou mot de passe incorrect." };
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!hasSupabaseConfig) return { error: NOT_CONFIGURED };
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim() || username;
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!/^[a-z0-9_.]{3,20}$/.test(username)) {
    return { error: "Le pseudo doit faire 3 à 20 caractères : lettres, chiffres, point ou tiret bas." };
  }
  if (displayName.length > 40) return { error: "Le nom affiché est trop long (40 caractères max)." };
  if (password.length < 6) return { error: "Le mot de passe doit faire au moins 6 caractères." };

  const supabase = await createClient();
  const { data: taken } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  if (taken) return { error: "Ce pseudo est déjà pris." };

  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: displayName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) {
    if (error.code === "user_already_exists") return { error: "Un compte existe déjà avec cet e-mail." };
    if (error.code === "weak_password") return { error: "Ce mot de passe est trop faible." };
    return { error: "L'inscription a échoué. Réessaie dans un instant." };
  }

  // Si Supabase demande de confirmer l'e-mail, il n'y a pas encore de session.
  if (!data.session) {
    return { message: "C'est presque fini ! Clique sur le lien reçu par e-mail pour activer ton compte." };
  }
  revalidatePath("/", "layout");
  redirect("/");
}

// Connexion en un clic : Google renvoie ensuite sur /auth/callback.
export async function signInWithGoogle() {
  if (!hasSupabaseConfig) redirect("/connexion");
  const supabase = await createClient();
  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) redirect("/connexion?erreur=google");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
