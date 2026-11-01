import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/data";
import ContactForm from "./ContactForm";

export const metadata: Metadata = { title: "Contact", description: "Une question, un souci, une idée ? Écris-nous." };

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const me = await getCurrentProfile();
  const { sujet } = await searchParams;
  return (
    <div className="auth legal-narrow">
      <h1>Contact</h1>
      <p className="small">
        Une question, un souci, une idée, ou une demande sur tes données ? Écris-nous ici. Voir aussi la{" "}
        <Link href="/confidentialite">confidentialité</Link> et les <Link href="/conditions">conditions</Link>.
      </p>
      <ContactForm loggedIn={Boolean(me)} topic={typeof sujet === "string" ? sujet : undefined} />
    </div>
  );
}
