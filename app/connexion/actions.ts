"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { logError } from "@/app/error-actions";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { getLocale } from "@/lib/server-locale";
import { isLocale, t } from "@/lib/i18n";

export type AuthState = { error?: string; message?: string };

async function actionLocale(formData: FormData) {
  const value = String(formData.get("locale") ?? "");
  return isLocale(value) ? value : getLocale();
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = await actionLocale(formData);
  if (!hasSupabaseConfig) return { error: t(locale, "supabaseNotConfigured") };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: t(locale, "emailNotConfirmed") };
    }
    return { error: t(locale, "invalidCredentials") };
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = await actionLocale(formData);
  if (!hasSupabaseConfig) return { error: t(locale, "supabaseNotConfigured") };
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim() || username;
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!/^[a-z0-9_.]{3,20}$/.test(username)) {
    return { error: t(locale, "invalidUsername") };
  }
  if (displayName.length > 40) return { error: t(locale, "displayNameTooLong") };
  if (password.length < 6) return { error: t(locale, "passwordTooShort") };

  const supabase = await createClient();
  const { data: taken } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  if (taken) return { error: t(locale, "usernameAlreadyUsed") };
  const { data: previousUsername, error: previousUsernameError } = await supabase
    .from("profile_username_aliases")
    .select("username")
    .eq("username", username)
    .maybeSingle();
  if (previousUsernameError) {
    return { error: t(locale, "usernameNotEnabled") };
  }
  if (previousUsername) return { error: t(locale, "usernameAlreadyUsed") };

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
    if (error.code === "user_already_exists") return { error: t(locale, "accountAlreadyExists") };
    if (error.code === "weak_password") return { error: t(locale, "weakPassword") };
    if (error.code === "over_email_send_rate_limit") {
      return { error: t(locale, "signupRateLimit") };
    }
    await logError({ message: `[e-mail] Inscription : ${error.code ?? error.status} ${error.message}`, path: "/connexion" });
    return { error: t(locale, "signupFailed") };
  }

  // Si Supabase demande de confirmer l'e-mail, il n'y a pas encore de session.
  if (!data.session) {
    return { message: t(locale, "confirmEmailSignup") };
  }
  revalidatePath("/", "layout");
  redirect("/bienvenue");
}

// Connexion en un clic : Google renvoie ensuite sur /auth/callback.
export async function signInWithGoogle() {
  if (!hasSupabaseConfig) redirect("/connexion?erreur=google");
  const supabase = await createClient();
  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) {
    console.error("[auth/google] OAuth initialization failed", {
      code: error?.code,
      status: error?.status,
      message: error?.message,
    });
    redirect("/connexion?erreur=google");
  }
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
  const locale = await actionLocale(formData);
  if (!hasSupabaseConfig) return { error: t(locale, "supabaseNotConfigured") };
  const email = String(formData.get("email") ?? "").trim();
  if (!email.includes("@")) return { error: t(locale, "missingEmail") };
  const supabase = await createClient();
  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/connexion/nouveau-mot-de-passe`,
  });
  if (error?.code === "over_email_send_rate_limit") {
    return { error: t(locale, "emailRateLimit") };
  }
  if (error && error.code !== "user_not_found") {
    // La vraie cause (souvent la configuration SMTP) est notée sur la page Modération.
    await logError({ message: `[e-mail] Mot de passe oublié : ${error.code ?? error.status} ${error.message}`, path: "/connexion/oubli" });
    return { error: t(locale, "resetEmailFailed") };
  }
  return { message: t(locale, "resetEmailNotice") };
}

// Enregistre le nouveau mot de passe (après le lien reçu par e-mail).
export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = await actionLocale(formData);
  if (!hasSupabaseConfig) return { error: t(locale, "supabaseNotConfigured") };
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) return { error: t(locale, "passwordTooShort") };
  if (password !== String(formData.get("confirm") ?? "")) return { error: t(locale, "passwordsDoNotMatch") };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return { error: t(locale, "samePassword") };
    if (error.code === "weak_password") return { error: t(locale, "weakPassword") };
    return { error: t(locale, "resetLinkExpired") };
  }
  revalidatePath("/", "layout");
  redirect("/");
}
