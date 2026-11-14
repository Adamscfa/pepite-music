import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Cover from "@/components/Cover";
import CoverHero from "@/components/CoverHero";
import ListenLinks from "@/components/ListenLinks";
import { MemberReviews, RatePanel, ScoreSummary } from "@/components/Ratings";
import TrackList from "@/app/album/TrackList";
import { getCurrentProfile, getRatingSummary, getTrackReviews } from "@/lib/data";
import { getAlbum, getTrack } from "@/lib/deezer";
import { formatDuration } from "@/lib/format";
import { aggregateRating, JsonLd, ratingText, siteUrl } from "@/lib/seo";

async function loadTrack(params: PageProps<"/titre/[id]">["params"]) {
  const id = Number((await params).id);
  const track = Number.isInteger(id) && id > 0 ? await getTrack(id) : null;
  if (!track) notFound();
  return track;
}

export async function generateMetadata({ params }: PageProps<"/titre/[id]">): Promise<Metadata> {
  const track = await loadTrack(params);
  const title = `${track.title} – ${track.artist}`;
  const { average, count } = await getRatingSummary({ trackId: track.id });
  const description = count
    ? `${track.title} de ${track.artist} (album ${track.albumTitle}) : noté ${ratingText(average, count)} sur Pépite. Lis les avis et donne ta note.`
    : `${track.title} de ${track.artist} (album ${track.albumTitle}) : écoute l'extrait, donne ta note et ton avis sur Pépite.`;
  return { title, description, alternates: { canonical: `/titre/${track.id}` }, openGraph: { title, description, images: [track.cover] } };
}

export default async function TrackPage({ params }: PageProps<"/titre/[id]">) {
  const track = await loadTrack(params);
  const [reviews, me, album] = await Promise.all([
    getTrackReviews(track.id),
    getCurrentProfile(),
    getAlbum(track.albumId),
  ]);

  // Les avis masqués par la modération sont déjà retirés (withSocial) : même note que la page.
  const visible = reviews;
  const average = visible.length ? visible.reduce((s, r) => s + r.rating, 0) / visible.length : 0;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MusicRecording",
          name: track.title,
          url: `${siteUrl}/titre/${track.id}`,
          image: track.cover,
          duration: `PT${Math.floor(track.duration / 60)}M${track.duration % 60}S`,
          byArtist: { "@type": "MusicGroup", name: track.artist, url: `${siteUrl}/artiste/${track.artistId}` },
          inAlbum: { "@type": "MusicAlbum", name: track.albumTitle, url: `${siteUrl}/album/${track.albumId}` },
          aggregateRating: aggregateRating(average, visible.length),
        }}
      />
      <CoverHero cover={track.coverSmall}>
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
            <ListenLinks
              deezerUrl={`https://www.deezer.com/track/${track.id}`}
              query={`${track.title} ${track.artist}`}
            />
          </div>
        </div>
      </CoverHero>

      <div className="cols">
        <div>
          <RatePanel me={me} reviews={reviews} albumId={track.albumId} trackId={track.id} what="ce titre" />
          <MemberReviews reviews={reviews} canLike={Boolean(me)} />
        </div>
        <TrackList
          tracks={album?.tracks.length ? album.tracks : [track]}
          artist={track.artist}
          cover={track.coverSmall}
          current={track.id}
        />
      </div>
    </>
  );
}
