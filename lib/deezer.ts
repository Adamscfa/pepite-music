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
  artistId: number;
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
    if (!res.ok) {
      console.error(`Deezer ${path} : réponse ${res.status}`);
      return null;
    }
    const json = (await res.json()) as T & DeezerError;
    // Deezer répond 200 même en cas d'erreur, avec un champ "error".
    if (json.error) {
      console.error(`Deezer ${path} : ${JSON.stringify(json.error)}`);
      return null;
    }
    return json;
  } catch (error) {
    // Visible dans Vercel > Logs.
    console.error(`Deezer ${path} : appel impossible`, error);
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
  artist: { id: number; name: string };
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
    artistId: a.artist.id,
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

// Le top albums du moment chez Deezer, pour l'accueil.
export async function getTopAlbums(limit = 10): Promise<AlbumHit[]> {
  const json = await get<RawSearch>(`/chart/0/albums?limit=${limit}`, 3600);
  return (json?.data ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    artist: a.artist.name,
    cover: a.cover_medium,
  }));
}

export type ArtistHit = { id: number; name: string; picture: string };

type RawArtists = { data: { id: number; name: string; picture_medium: string }[] };

export async function searchArtists(query: string): Promise<ArtistHit[]> {
  const json = await get<RawArtists>(`/search/artist?q=${encodeURIComponent(query)}&limit=3`, 3600);
  return (json?.data ?? []).map((a) => ({ id: a.id, name: a.name, picture: a.picture_medium }));
}

export type Artist = { id: number; name: string; picture: string; fans: number };

export async function getArtist(id: number): Promise<Artist | null> {
  const a = await get<{ id: number; name: string; picture_xl: string; nb_fan: number }>(`/artist/${id}`, 86400);
  return a ? { id: a.id, name: a.name, picture: a.picture_xl, fans: a.nb_fan } : null;
}

export type ArtistAlbum = AlbumHit & { year: number | null; type: string };

type RawArtistAlbums = {
  data: { id: number; title: string; cover_medium: string; release_date?: string; record_type: string }[];
};

// Discographie d'un artiste, du plus récent au plus ancien.
export async function getArtistAlbums(artist: Artist): Promise<ArtistAlbum[]> {
  const json = await get<RawArtistAlbums>(`/artist/${artist.id}/albums?limit=100`, 86400);
  return (json?.data ?? [])
    .map((a) => {
      const year = a.release_date ? Number(a.release_date.slice(0, 4)) : NaN;
      return {
        id: a.id,
        title: a.title,
        artist: artist.name,
        cover: a.cover_medium,
        year: Number.isFinite(year) && year > 0 ? year : null,
        type: a.record_type,
      };
    })
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
}
