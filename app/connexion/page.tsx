import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";
import { getLocale } from "@/lib/server-locale";
import { t } from "@/lib/i18n";
import AuthForm from "./AuthForm";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: t(locale, "login") };
}

export default async function LoginPage({ searchParams }: PageProps<"/connexion">) {
  if (await getCurrentProfile()) redirect("/");
  const [{ erreur, mode }, locale] = await Promise.all([searchParams, getLocale()]);
  return <AuthForm linkError={erreur === "lien"} googleError={erreur === "google"} signUpFirst={mode === "inscription"} locale={locale} />;
}
