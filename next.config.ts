import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Laisse passer les photos de profil (2 Mo max) envoyées par formulaire.
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
