import type { Metadata } from "next";
import Link from "next/link";
import ResetForm from "./ResetForm";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <div className="auth">
      <h1>Mot de passe oublié</h1>
      <p className="small">Entre l&apos;adresse e-mail de ton compte : on t&apos;envoie un lien pour en choisir un nouveau.</p>
      <ResetForm />
      <p className="small" style={{ marginTop: 16 }}>
        <Link href="/connexion" className="link-btn">
          ← Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
