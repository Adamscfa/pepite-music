import type { MetadataRoute } from "next";

// Fiche de l'appli : nom, icônes et couleurs quand on installe Pépite sur le téléphone.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pépite",
    short_name: "Pépite",
    description: "Note et critique les albums que tu écoutes, et découvre ce que la communauté écoute.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F3F2F7",
    theme_color: "#0D1A14",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
