import { coverPalette } from "@/lib/colors";

// Haut de page teinté avec la couleur de la pochette, comme sur Spotify.
export default async function CoverHero({ cover, children }: { cover: string | null; children: React.ReactNode }) {
  const palette = await coverPalette(cover);
  return (
    <div
      className="hero-tint"
      style={palette ? ({ "--tint": palette.main, "--tint-dark": palette.dark } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
