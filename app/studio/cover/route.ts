import { getCurrentProfile } from "@/lib/data";

// Pochette Deezer servie depuis Pépite, pour les vidéos du Studio : le navigateur ne peut
// enregistrer une vidéo que si toutes les images dessinées viennent du même site.
// Réservé aux admins, et seulement pour les images de Deezer (pas n'importe quelle adresse).
const DEEZER_IMAGES = /^https:\/\/([a-z0-9-]+\.)*dzcdn\.net\//i;

export async function GET(request: Request) {
  const me = await getCurrentProfile();
  if (!me?.is_admin) return new Response("Réservé aux admins", { status: 404 });

  const url = new URL(request.url).searchParams.get("u") ?? "";
  if (!DEEZER_IMAGES.test(url)) return new Response("Adresse refusée", { status: 400 });

  try {
    const res = await fetch(url, { cache: "force-cache", signal: AbortSignal.timeout(8000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return new Response("Image indisponible", { status: 502 });
    return new Response(await res.arrayBuffer(), {
      headers: { "Content-Type": type, "Cache-Control": "private, max-age=86400" },
    });
  } catch {
    return new Response("Image indisponible", { status: 502 });
  }
}
