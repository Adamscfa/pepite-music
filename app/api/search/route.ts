import { searchAlbums, searchArtists, searchTracks } from "@/lib/deezer";

// Le navigateur ne peut pas appeler Deezer directement (pas de CORS),
// alors la barre de recherche passe par ici.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (q.length < 2) return Response.json({ artists: [], albums: [], tracks: [] });
  const [artists, albums, tracks] = await Promise.all([searchArtists(q), searchAlbums(q), searchTracks(q)]);
  return Response.json({ artists, albums, tracks });
}
