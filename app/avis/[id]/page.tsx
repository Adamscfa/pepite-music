import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CommentThread from "@/components/CommentThread";
import Cover from "@/components/Cover";
import ReviewCard from "@/components/ReviewCard";
import StoryButton from "@/components/StoryButton";
import { getComments, getCurrentProfile, getReview, getReviewCounts } from "@/lib/data";
import { getAlbum, getArtist, getArtistAlbums } from "@/lib/deezer";

async function loadReview(params: PageProps<"/avis/[id]">["params"]) {
  const id = Number((await params).id);
  const review = Number.isInteger(id) && id > 0 ? await getReview(id) : null;
  if (!review) notFound();
  return review;
}

export async function generateMetadata({ params }: PageProps<"/avis/[id]">): Promise<Metadata> {
  const review = await loadReview(params);
  const name = review.track_title ?? review.album_title;
  const title = `${review.profile.display_name} a noté ${name} ${"★".repeat(review.rating)}`;
  const description = review.body ? review.body.slice(0, 160) : `${name} de ${review.artist_name}, noté sur Pépite.`;
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ReviewPage({ params }: PageProps<"/avis/[id]">) {
  const review = await loadReview(params);
  const [comments, me, more] = await Promise.all([
    getComments(review.id),
    getCurrentProfile(),
    moreByArtist(review.album_id),
  ]);

  return (
    <div className="with-rail">
      <div className="feed-col">
        <div className="eyebrow">Avis</div>
        <ReviewCard review={review} canLike={Boolean(me)} />
        <div className="row" style={{ justifyContent: "flex-start", margin: "-6px 0 0" }}>
          <StoryButton reviewId={review.id} />
        </div>
        <CommentThread
          reviewId={review.id}
          comments={comments}
          me={me ? { username: me.username, display_name: me.display_name, avatar_url: me.avatar_url } : null}
          meId={me?.id ?? null}
        />
      </div>

      {more && more.albums.length > 0 && (
        <aside className="rail">
          <section className="rail-box">
            <h2 className="rail-title">Plus de {more.artist.name}</h2>
            <div className="more-cards">
              {more.albums.map((a) => (
                <Link key={a.id} href={`/album/${a.id}`} className="more-card">
                  <Cover src={a.cover} size="m" />
                  <span className="rank-text">
                    <b>{a.title}</b>
                    <small>{more.artist.name}</small>
                    <small>
                      {[a.year, a.type === "single" ? "Single" : a.type === "ep" ? "EP" : "Album"]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                    <span className="more-stats">
                      <span title="Avis sur Pépite">★ {more.counts.get(a.id) ?? 0} avis</span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
            <Link href={`/artiste/${more.artist.id}`} className="more-link rail-more">
              Toute la discographie →
            </Link>
          </section>
        </aside>
      )}
    </div>
  );
}

// Les autres albums de l'artiste, pour la colonne de droite.
async function moreByArtist(albumId: number) {
  const album = await getAlbum(albumId);
  if (!album) return null;
  const artist = await getArtist(album.artistId);
  if (!artist) return null;
  const albums = (await getArtistAlbums(artist)).filter((a) => a.id !== albumId).slice(0, 4);
  const counts = await getReviewCounts(albums.map((a) => a.id));
  return { artist, albums, counts };
}
