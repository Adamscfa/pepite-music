import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

// Ce que les moteurs de recherche peuvent visiter. Les pages privées (messages,
// réglages, pages admin) ne servent à rien dans Google.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/messages",
        "/notifications",
        "/reglages",
        "/bienvenue",
        "/studio",
        "/tableau-de-bord",
        "/moderation",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
