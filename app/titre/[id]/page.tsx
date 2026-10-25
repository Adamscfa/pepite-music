import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Cover from "@/components/Cover";
import { MemberReviews, RatePanel, ScoreSummary } from "@/components/Ratings";
import TrackList from "@/app/album/TrackList";
import { getCurrentProfile, getTrackReviews } from "@/lib/data";
import { getAlbum, getTrack } from "@/lib/deezer";
import { formatDuration } from "@/lib/format";

async function loadTrack(params: PageProps<"/titre/[id]">["params"]) {
  const id = Number((await params).id);
  const track = Number.isInteger(id) && id > 0 ? await getTrack(id) : null;
  if (!track) notFound();
  return track;
}

export async function generateMetadata({ params }: PageProps<"/titre/[id]">): Promise<Metadata> {
  const track = await loadTrack(params);
  const title = `${track.title} – ${track.artist}`;
  return { title, openGraph: { title, images: [track.cover] } };
}

export default async function TrackPage({ params }: PageProps<"/titre/[id]">) {
  const track = await loadTrack(params);
  const [reviews, me, album] = await Promise.all([getTrackReviews(track.id), getCurrentProfile(), getAlbum(track.albumId)]);

  return (
    <>
      <div className="album-top">
        <Cover src={track.cover} size="l" alt={`Pochette de ${track.albumTitle}`} />
        <div>
          <div className="eyebrow">Titre</div>
          <h1>{track.title}</h1>
          <Link href={`/artiste/${track.artistId}`} className="artist link-under">
            {track.artist}
          </Link>
          <div className="facts">
            {track.year ? `${track.year} · ` : ""}
            {formatDuration(track.duration)} ·{" "}
            <Link href={`/album/${track.albumId}`} className="link-under">
              {track.albumTitle}
            </Link>
          </div>
          <ScoreSummary reviews={reviews} />
        </div>
      </div>

      <div className="cols">
        <div>
          <RatePanel me={me} reviews={reviews} albumId={track.albumId} trackId={track.id} what="ce titre" />
          <MemberReviews reviews={reviews} canLike={Boolean(me)} />
        </div>
        <TrackList tracks={album?.tracks.length ? album.tracks : [track]} current={track.id} />
      </div>
    </>
  );
}
