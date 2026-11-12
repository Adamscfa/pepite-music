import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Cover from "@/components/Cover";
import CoverHero from "@/components/CoverHero";
import ListenLinks from "@/components/ListenLinks";
import { MemberReviews, RatePanel, ScoreSummary } from "@/components/Ratings";
import {
  getAlbumReviews,
  getCurrentProfile,
  getFavorites,
  getFriends,
  getRatingSummary,
  getUserLists,
  getWeeklyPepite,
} from "@/lib/data";
import { getAlbum } from "@/lib/deezer";
import { aggregateRating, JsonLd, ratingText, siteUrl } from "@/lib/seo";
import AlbumActions from "../AlbumActions";
import TrackList from "../TrackList";
import WeeklyVote from "../WeeklyVote";

async function loadAlbum(params: PageProps<"/album/[id]">["params"]) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const album = await getAlbum(id);
  if (!album) notFound();
  return album;
}

export async function generateMetadata({ params }: PageProps<"/album/[id]">): Promise<Metadata> {
  const album = await loadAlbum(params);
  const { average, count } = await getRatingSummary({ albumId: album.id });
  // Description lue par Google sous le titre du résultat.
  const description = count
    ? `${album.title} de ${album.artist}${album.year ? ` (${album.year})` : ""} : noté ${ratingText(average, count)} sur Pépite. Lis les avis et donne ta note.`
    : `${album.title} de ${album.artist}${album.year ? ` (${album.year})` : ""} : écoute les extraits, donne ta note et ton avis sur Pépite.`;
  return {
    title: `${album.title} – ${album.artist}`,
    description,
    alternates: { canonical: `/album/${album.id}` },
  };
}

export default async function AlbumPage({ params }: PageProps<"/album/[id]">) {
  const albumId = Number((await params).id);
  if (!Number.isInteger(albumId) || albumId <= 0) notFound();
  const [album, reviews, me] = await Promise.all([
    getAlbum(albumId),
    getAlbumReviews(albumId),
    getCurrentProfile(),
  ]);
  if (!album) notFound();
  // Les avis masqués par la modération sont déjà retirés (withSocial) : même note que la page.
  const visible = reviews;
  const average = visible.length ? visible.reduce((s, r) => s + r.rating, 0) / visible.length : 0;
  const [myLists, friends, weekly, favorites] = me
    ? await Promise.all([getUserLists(me.id), getFriends(me.id), getWeeklyPepite(me.id), getFavorites(me.id)])
    : [[], [], null, []];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MusicAlbum",
          name: album.title,
          url: `${siteUrl}/album/${album.id}`,
          image: album.cover,
          byArtist: { "@type": "MusicGroup", name: album.artist, url: `${siteUrl}/artiste/${album.artistId}` },
          ...(album.year ? { datePublished: String(album.year) } : {}),
          ...(album.genre ? { genre: album.genre } : {}),
          numTracks: album.trackCount,
          aggregateRating: aggregateRating(average, visible.length),
        }}
      />
      <CoverHero cover={album.coverSmall}>
        <div className="album-top">
          <Cover src={album.cover} size="l" alt={`Pochette de ${album.title}`} />
          <div>
            <div className="eyebrow">Album{album.genre ? ` · ${album.genre}` : ""}</div>
            <h1>{album.title}</h1>
            <Link href={`/artiste/${album.artistId}`} className="artist link-under">
              {album.artist}
            </Link>
            <div className="facts">
              {album.year ? `${album.year} · ` : ""}
              {album.trackCount} titre{album.trackCount > 1 ? "s" : ""}
            </div>
            <ScoreSummary reviews={reviews} />
            <ListenLinks
              deezerUrl={`https://www.deezer.com/album/${album.id}`}
              query={`${album.title} ${album.artist}`}
            />
          </div>
        </div>
      </CoverHero>

      <div className="cols">
        <div>
          <RatePanel me={me} reviews={reviews} albumId={album.id} what="cet album" />
          {me && (
            <AlbumActions
              albumId={album.id}
              lists={myLists.map((l) => ({ id: l.id, title: l.title }))}
              friends={friends}
              isFavorite={favorites.some((favorite) => favorite.album_id === album.id)}
            />
          )}
          {weekly && (
            <div className="box" style={{ marginTop: 14 }}>
              <WeeklyVote albumId={album.id} myVote={weekly.myVote} />
            </div>
          )}
          <MemberReviews reviews={reviews} canLike={Boolean(me)} />
        </div>
        <TrackList tracks={album.tracks} artist={album.artist} cover={album.coverSmall} />
      </div>
    </>
  );
}
