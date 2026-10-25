import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Cover from "@/components/Cover";
import CoverHero from "@/components/CoverHero";
import ListenLinks from "@/components/ListenLinks";
import { MemberReviews, RatePanel, ScoreSummary } from "@/components/Ratings";
import { getAlbumReviews, getCurrentProfile, getFriends, getUserLists, getWeeklyPepite } from "@/lib/data";
import { getAlbum } from "@/lib/deezer";
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
  return { title: `${album.title} – ${album.artist}` };
}

export default async function AlbumPage({ params }: PageProps<"/album/[id]">) {
  const album = await loadAlbum(params);
  const [reviews, me] = await Promise.all([getAlbumReviews(album.id), getCurrentProfile()]);
  const [myLists, friends, weekly] = me
    ? await Promise.all([getUserLists(me.id), getFriends(me.id), getWeeklyPepite(me.id)])
    : [[], [], null];

  return (
    <>
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
