import { searchAlbums } from "@/lib/deezer";

// Le navigateur ne peut pas appeler Deezer directement (pas de CORS),
// alors la barre de recherche passe par ici.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json([]);
  return Response.json(await searchAlbums(q.slice(0, 100)));
}
