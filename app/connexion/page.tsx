import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";
import AuthForm from "./AuthForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: PageProps<"/connexion">) {
  if (await getCurrentProfile()) redirect("/");
  const { erreur } = await searchParams;
  return <AuthForm linkError={erreur === "lien"} />;
}
