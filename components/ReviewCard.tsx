import Link from "next/link";
import type { Review } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import AuthorLink from "./AuthorLink";
import Cover from "./Cover";
import LikeButton from "./LikeButton";
import Stars from "./Stars";

export default function ReviewCard({ review, canLike }: { review: Review; canLike: boolean }) {
  const album = `/album/${review.album_id}`;
  return (
    <article className="review">
      <Link href={album} aria-label={review.album_title}>
        <Cover src={review.cover_url} size="m" />
      </Link>
      <div>
        <div className="who">
          <AuthorLink user={review.profile} />
          a noté · {timeAgo(review.updated_at)}
        </div>
        <Link href={album} className="link">
          <h3>{review.album_title}</h3>
        </Link>
        <div className="artist">
          {review.artist_name}
          {review.release_year ? ` · ${review.release_year}` : ""}
        </div>
        <div style={{ marginTop: 6 }}>
          <Stars value={review.rating} />
        </div>
        {review.body && <p>{review.body}</p>}
        <ReviewMeta review={review} canLike={canLike} />
      </div>
    </article>
  );
}

export function ReviewMeta({ review, canLike }: { review: Review; canLike: boolean }) {
  return (
    <div className="meta">
      <LikeButton reviewId={review.id} likes={review.likes} liked={review.liked} canLike={canLike} />
      <Link href={`/avis/${review.id}`} className="like">
        💬 {review.comments === 0 ? "Commenter" : `${review.comments} commentaire${review.comments > 1 ? "s" : ""}`}
      </Link>
    </div>
  );
}
