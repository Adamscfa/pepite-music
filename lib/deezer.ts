import "server-only";

// API publique de Deezer : pas de clé, mais pas de CORS non plus,
// donc on l'appelle uniquement côté serveur.
const API = process.env.DEEZER_API_URL ?? "https://api.deezer.com";

export type AlbumHit = {
  id: number;
  title: string;
  artist: string;
  cover: string;
};

export type Track = {
  id: number;
  title: string;
  duration: number;
  preview: string;
};

export type Album = {
  id: number;
  title: string;
  artist: string;
  cover: string;
  coverSmall: string;
  year: number | null;
  genre: string | null;
  trackCount: number;
  tracks: Track[];
};

type DeezerError = { error?: { message?: string } };

async function get<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    const json = (await res.json()) as T & DeezerError;
    // Deezer répond 200 même en cas d'erreur, avec un champ "error".
    return json.error ? null : json;
  } catch {
    return null;
  }
}

type RawSearch = {
  data: { id: number; title: string; cover_medium: string; artist: { name: string } }[];
};

export async function searchAlbums(query: string): Promise<AlbumHit[]> {
  const json = await get<RawSearch>(
    `/search/album?q=${encodeURIComponent(query)}&limit=8`,
    3600,
  );
  return (json?.data ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    artist: a.artist.name,
    cover: a.cover_medium,
  }));
}

type RawAlbum = {
  id: number;
  title: string;
  cover_xl: string;
  cover_medium: string;
  release_date?: string;
  nb_tracks: number;
  artist: { name: string };
  genres?: { data: { name: string }[] };
  tracks?: { data: { id: number; title: string; duration: number; preview: string }[] };
};

export async function getAlbum(id: number): Promise<Album | null> {
  const a = await get<RawAlbum>(`/album/${id}`, 86400);
  if (!a) return null;
  const year = a.release_date ? Number(a.release_date.slice(0, 4)) : NaN;
  return {
    id: a.id,
    title: a.title,
    artist: a.artist.name,
    cover: a.cover_xl,
    coverSmall: a.cover_medium,
    year: Number.isFinite(year) && year > 0 ? year : null,
    genre: a.genres?.data[0]?.name ?? null,
    trackCount: a.nb_tracks,
    tracks: (a.tracks?.data ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      duration: t.duration,
      preview: t.preview,
    })),
  };
}
