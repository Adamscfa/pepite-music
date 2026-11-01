import "server-only";
import { getUserReviews, type Profile } from "./data";
import { getAlbum, getArtistAlbums, getChart, getGenres, getRelatedArtists, type AlbumHit } from "./deezer";

export type ForYou = AlbumHit & { because: string };

// « Pour toi » : des albums d'artistes proches de ceux que tu as le mieux notés.
// Sans notes, on part des genres choisis au premier pas.
export async function getForYou(me: Profile, limit = 12): Promise<ForYou[]> {
  const reviews = await getUserReviews(me.id);
  const rated = new Set(reviews.map((r) => r.album_id));
  const seeds = [...reviews]
    .filter((r) => r.rating >= 4)
    .sort((a, b) => Number(b.heart) - Number(a.heart) || b.rating - a.rating)
    .filter((r, i, all) => all.findIndex((x) => x.album_id === r.album_id) === i)
    .slice(0, 4);

  const seen = new Set<number>();
  const picks: ForYou[] = [];
  const add = (a: AlbumHit, because: string) => {
    if (picks.length >= limit || rated.has(a.id) || seen.has(a.id)) return;
    seen.add(a.id);
    picks.push({ ...a, because });
  };

  const fromSeeds = await Promise.all(
    seeds.map(async (seed) => {
      const album = await getAlbum(seed.album_id);
      if (!album) return [];
      const related = await getRelatedArtists(album.artistId, 4);
      const discographies = await Promise.all(related.map((artist) => getArtistAlbums(artist)));
      return discographies.map((albums) => ({
        album: albums.find((a) => a.type === "album") ?? albums[0],
        because: `Parce que tu as aimé ${seed.album_title}`,
      }));
    }),
  );
  // On alterne entre les albums de départ pour varier.
  for (let i = 0; i < 4; i++) {
    for (const list of fromSeeds) {
      const pick = list[i];
      if (pick?.album) add(pick.album, pick.because);
    }
  }

  if (picks.length < limit && me.favorite_genres?.length) {
    const genres = await getGenres();
    const charts = await Promise.all(me.favorite_genres.slice(0, 3).map((g) => getChart(g)));
    charts.forEach((chart, i) => {
      const name = genres.find((g) => g.id === me.favorite_genres![i])?.name ?? "ce genre";
      chart.albums.slice(0, 6).forEach((a) => add(a, `Parce que tu aimes ${name}`));
    });
  }
  return picks;
}
