import "server-only";

export type Palette = { main: string; dark: string };

// Couleur dominante d'une pochette, pour teinter le haut de la page album.
// Renvoie null si l'image est introuvable : la page garde alors ses couleurs normales.
export async function coverPalette(url: string | null): Promise<Palette | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { next: { revalidate: 604800 } });
    if (!res.ok) return null;
    const { default: sharp } = await import("sharp");
    const { dominant } = await sharp(Buffer.from(await res.arrayBuffer())).stats();
    const { r, g, b } = dominant;
    const shade = (k: number) => `rgb(${Math.round(r * k)} ${Math.round(g * k)} ${Math.round(b * k)})`;
    return { main: `rgb(${r} ${g} ${b})`, dark: shade(0.35) };
  } catch (error) {
    console.error("Couleur de pochette impossible", error);
    return null;
  }
}
