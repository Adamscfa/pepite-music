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
  const json = await get<RawSearch>(`/search/album?q=${encodeURIComponent(query)}&limit=8`, 3600);
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

// Les sorties récentes mises en avant par Deezer.
export async function getNewReleases(limit = 12): Promise<AlbumHit[]> {
  const json = await get<RawSearch>(`/editorial/0/releases?limit=${limit}`, 3600);
  return (json?.data ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    artist: a.artist.name,
    cover: a.cover_medium,
  }));
}

// ---- Classements ----

// Genres Deezer proposés sur la page Classements (0 = tous les genres).
export const CHART_GENRES = [
  { id: 0, name: "Tout" },
  { id: 116, name: "Rap" },
  { id: 132, name: "Pop" },
  { id: 152, name: "Rock" },
  { id: 106, name: "Électro" },
  { id: 165, name: "R&B" },
  { id: 113, name: "Dance" },
  { id: 129, name: "Jazz" },
];

// Playlist officielle « Top Monde » de Deezer.
const WORLD_PLAYLIST = 3155776842;

export type ChartTrack = TrackHit & { duration: number; preview: string; albumTitle: string; artistId: number };

type RawChartTracks = {
  data: {
    id: number;
    title: string;
    duration: number;
    preview: string;
    artist: { id: number; name: string };
    album: { id: number; title: string; cover_medium: string };
  }[];
};

const chartTrack = (t: RawChartTracks["data"][number]): ChartTrack => ({
  id: t.id,
  title: t.title,
  duration: t.duration,
  preview: t.preview,
  artist: t.artist.name,
  artistId: t.artist.id,
  albumId: t.album.id,
  albumTitle: t.album.title,
  cover: t.album.cover_medium,
});

// Top titres, albums et artistes d'un genre. Deezer classe selon le pays du serveur
// (Paris sur Vercel), donc ce sont les tops France.
export async function getChart(genre: number) {
  const [tracks, albums, artists] = await Promise.all([
    get<RawChartTracks>(`/chart/${genre}/tracks?limit=50`, 3600),
    get<RawSearch>(`/chart/${genre}/albums?limit=20`, 3600),
    get<RawArtists>(`/chart/${genre}/artists?limit=20`, 3600),
  ]);
  return {
    tracks: (tracks?.data ?? []).map(chartTrack),
    albums: (albums?.data ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      artist: a.artist.name,
      cover: a.cover_medium,
    })),
    artists: (artists?.data ?? []).map((a) => ({ id: a.id, name: a.name, picture: a.picture_medium })),
  };
}

export async function getPlaylistTracks(id: number): Promise<ChartTrack[]> {
  const json = await get<RawChartTracks>(`/playlist/${id}/tracks?limit=50`, 3600);
  return (json?.data ?? []).map(chartTrack);
}

export const getWorldTopTracks = () => getPlaylistTracks(WORLD_PLAYLIST);

// Compte « Deezer Charts », qui publie une playlist « Top <pays> » par pays.
const CHARTS_USER = 637006841;

export type CountryChart = { id: number; title: string };

type RawPlaylists = { data: { id: number; title: string; user?: { name: string } }[] };

const isCountryTop = (p: { id: number; title: string }) =>
  /^Top [^0-9]/i.test(p.title) && p.id !== WORLD_PLAYLIST && !/worldwide|monde/i.test(p.title);

// Les tops par pays, triés par nom. Si le compte Deezer Charts ne répond pas,
// on les cherche parmi les playlists publiées par Deezer.
export async function getCountryCharts(): Promise<CountryChart[]> {
  const own = await get<RawPlaylists>(`/user/${CHARTS_USER}/playlists?limit=200`, 86400);
  let list = (own?.data ?? []).filter(isCountryTop);
  if (!list.length) {
    const found = await get<RawPlaylists>(`/search/playlist?q=${encodeURIComponent("Top")}&limit=100`, 86400);
    list = (found?.data ?? []).filter((p) => isCountryTop(p) && /deezer/i.test(p.user?.name ?? ""));
  }
  const unique = new Map(list.map((p) => [p.id, { id: p.id, title: p.title }]));
  return [...unique.values()].sort((a, b) => a.title.localeCompare(b.title, "fr"));
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

export type TrackHit = { id: number; title: string; artist: string; albumId: number; cover: string };

type RawTracks = {
  data: { id: number; title: string; artist: { name: string }; album: { id: number; cover_medium: string } }[];
};

export async function searchTracks(query: string): Promise<TrackHit[]> {
  const json = await get<RawTracks>(`/search/track?q=${encodeURIComponent(query)}&limit=5`, 3600);
  return (json?.data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.artist.name,
    albumId: t.album.id,
    cover: t.album.cover_medium,
  }));
}

export type TrackDetail = Track & {
  artist: string;
  artistId: number;
  albumId: number;
  albumTitle: string;
  cover: string;
  coverSmall: string;
  year: number | null;
};

type RawTrack = {
  id: number;
  title: string;
  duration: number;
  preview: string;
  release_date?: string;
  artist: { id: number; name: string };
  album: { id: number; title: string; cover_xl: string; cover_medium: string };
};

export async function getTrack(id: number): Promise<TrackDetail | null> {
  const t = await get<RawTrack>(`/track/${id}`, 86400);
  if (!t) return null;
  const year = t.release_date ? Number(t.release_date.slice(0, 4)) : NaN;
  return {
    id: t.id,
    title: t.title,
    duration: t.duration,
    preview: t.preview,
    artist: t.artist.name,
    artistId: t.artist.id,
    albumId: t.album.id,
    albumTitle: t.album.title,
    cover: t.album.cover_xl,
    coverSmall: t.album.cover_medium,
    year: Number.isFinite(year) && year > 0 ? year : null,
  };
}
