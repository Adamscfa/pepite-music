"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { logError } from "@/app/error-actions";
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
    if (error.code === "over_email_send_rate_limit") {
      return { error: "Trop d'inscriptions en même temps. Réessaie dans quelques minutes." };
    }
    await logError({ message: `[e-mail] Inscription : ${error.code ?? error.status} ${error.message}`, path: "/connexion" });
    return { error: "L'inscription a échoué. Réessaie dans un instant." };
  }

  // Si Supabase demande de confirmer l'e-mail, il n'y a pas encore de session.
  if (!data.session) {
    return { message: "C'est presque fini ! Clique sur le lien reçu par e-mail pour activer ton compte." };
  }
  revalidatePath("/", "layout");
  redirect("/bienvenue");
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

// ---- Mot de passe oublié ----

// Envoie un e-mail avec un lien pour choisir un nouveau mot de passe.
// Même réponse que l'adresse existe ou non : on ne révèle pas qui est inscrit.
export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!hasSupabaseConfig) return { error: NOT_CONFIGURED };
  const email = String(formData.get("email") ?? "").trim();
  if (!email.includes("@")) return { error: "Entre ton adresse e-mail." };
  const supabase = await createClient();
  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/connexion/nouveau-mot-de-passe`,
  });
  if (error?.code === "over_email_send_rate_limit") {
    return { error: "Trop d'e-mails envoyés pour l'instant. Réessaie dans quelques minutes." };
  }
  if (error && error.code !== "user_not_found") {
    // La vraie cause (souvent la configuration SMTP) est notée sur la page Modération.
    await logError({ message: `[e-mail] Mot de passe oublié : ${error.code ?? error.status} ${error.message}`, path: "/connexion/oubli" });
    return { error: "L'e-mail n'a pas pu partir. Réessaie dans un moment ; si ça continue, écris-nous depuis la page Contact." };
  }
  return { message: "Si un compte existe avec cette adresse, tu vas recevoir un e-mail avec un lien. Pense à regarder dans les spams." };
}

// Enregistre le nouveau mot de passe (après le lien reçu par e-mail).
export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!hasSupabaseConfig) return { error: NOT_CONFIGURED };
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) return { error: "Le mot de passe doit faire au moins 6 caractères." };
  if (password !== String(formData.get("confirm") ?? "")) return { error: "Les deux mots de passe ne sont pas identiques." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return { error: "C'est déjà ton mot de passe actuel. Choisis-en un autre." };
    if (error.code === "weak_password") return { error: "Ce mot de passe est trop faible." };
    return { error: "Le lien a expiré. Redemande un e-mail depuis « Mot de passe oublié »." };
  }
  revalidatePath("/", "layout");
  redirect("/");
}
