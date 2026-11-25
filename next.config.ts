import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
    // Laisse passer les photos de profil (2 Mo max) envoyées par formulaire.
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
