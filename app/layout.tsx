import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree, JetBrains_Mono } from "next/font/google";
import Header from "@/components/Header";
import SetupNotice from "@/components/SetupNotice";
import "./globals.css";

const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], weight: ["500", "700", "800"] });
const body = Figtree({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["500"] });

// Les pages dépendent du membre connecté : on les génère à chaque visite.
export const dynamic = "force-dynamic";

// Adresse publique du site, pour les liens dans les aperçus de partage.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  openGraph: { siteName: "Pépite", locale: "fr_FR", type: "website" },
  title: { default: "Pépite", template: "%s · Pépite" },
  description: "Note et critique les albums que tu écoutes, et découvre ce que la communauté écoute.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <Header />
        <main>
          <SetupNotice />
          {children}
        </main>
      </body>
    </html>
  );
}
