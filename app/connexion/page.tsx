import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";
import { getLocale } from "@/lib/server-locale";
import AuthForm from "./AuthForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: PageProps<"/connexion">) {
  if (await getCurrentProfile()) redirect("/");
  const [{ erreur, mode }, locale] = await Promise.all([searchParams, getLocale()]);
  return <AuthForm linkError={erreur === "lien"} googleError={erreur === "google"} signUpFirst={mode === "inscription"} locale={locale} />;
}
