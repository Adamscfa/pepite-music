import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";
import NewPasswordForm from "./NewPasswordForm";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

// On arrive ici depuis le lien de l'e-mail « Mot de passe oublié » (déjà connecté par ce lien).
export default async function NewPasswordPage() {
  if (!(await getCurrentProfile())) redirect("/connexion/oubli");
  return (
    <div className="auth">
      <h1>Nouveau mot de passe</h1>
      <p className="small">Choisis ton nouveau mot de passe (6 caractères minimum).</p>
      <NewPasswordForm />
    </div>
  );
}
