import type { Metadata } from "next";
import { cookies } from "next/headers";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import Header from "@/components/Header";
import PlayerProvider from "@/components/Player";
import SetupNotice from "@/components/SetupNotice";
import "./globals.css";

// Une seule police ronde et nette pour tout le site (titres et texte), comme sur la maquette.
const sans = Plus_Jakarta_Sans({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Thème choisi avec le bouton ☀/☾ ; sans choix, on suit le réglage du téléphone.
  const theme = (await cookies()).get("theme")?.value;
  return (
    <html
      lang="fr"
      className={`${sans.variable} ${mono.variable}`}
      data-theme={theme === "light" || theme === "dark" ? theme : undefined}
    >
      <body>
        <PlayerProvider>
          <div className="shell">
            <Header />
            <main>
              <SetupNotice />
              {children}
            </main>
          </div>
        </PlayerProvider>
      </body>
    </html>
  );
}
