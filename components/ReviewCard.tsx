import Link from "next/link";
import { getCurrentProfile, type Review } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import AuthorLink from "./AuthorLink";
import Cover from "./Cover";
import LikeButton from "./LikeButton";
import Reactions from "./Reactions";
import ReportButton from "./ReportButton";
import Stars from "./Stars";

export default function ReviewCard({ review, canLike }: { review: Review; canLike: boolean }) {
  const album = `/album/${review.album_id}`;
  const target = review.track_id ? `/titre/${review.track_id}` : album;
  const title = review.track_title ?? review.album_title;
  return (
    <article className="review">
      <Link href={target} aria-label={title}>
        <Cover src={review.cover_url} size="m" />
      </Link>
      <div>
        <div className="who">
          <AuthorLink user={review.profile} />
          {review.track_id ? "a noté le titre" : "a noté"} · {timeAgo(review.updated_at)}
        </div>
        <Link href={target} className="link">
          <h3>{title}</h3>
        </Link>
        <div className="artist">
          {review.artist_name}
          {review.track_id ? (
            <>
              {" · "}
              <Link href={album} className="link-under">
                {review.album_title}
              </Link>
            </>
          ) : (
            review.release_year && ` · ${review.release_year}`
          )}
        </div>
        <div style={{ marginTop: 6 }}>
          <Stars value={review.rating} heart={review.heart} />
        </div>
        {review.body && <p>{review.body}</p>}
        <ReviewMeta review={review} canLike={canLike} />
      </div>
    </article>
  );
}

export async function ReviewMeta({ review, canLike }: { review: Review; canLike: boolean }) {
  const me = await getCurrentProfile();
  return (
    <div className="meta">
      <LikeButton reviewId={review.id} likes={review.likes} liked={review.liked} canLike={canLike} />
      <Link href={`/avis/${review.id}`} className="like">
        💬 {review.comments === 0 ? "Commenter" : `${review.comments} commentaire${review.comments > 1 ? "s" : ""}`}
      </Link>
      <Reactions reviewId={review.id} reactions={review.reactions} canReact={canLike} />
      {me && me.id !== review.user_id && <ReportButton reviewId={review.id} />}
    </div>
  );
}
