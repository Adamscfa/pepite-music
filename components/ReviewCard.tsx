import Link from "next/link";
import type { Review } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import Avatar from "./Avatar";
import Cover from "./Cover";
import Stars from "./Stars";

export default function ReviewCard({ review }: { review: Review }) {
  const album = `/album/${review.album_id}`;
  const { username, display_name } = review.profile;
  return (
    <article className="review">
      <Link href={album} aria-label={review.album_title}>
        <Cover src={review.cover_url} size="m" />
      </Link>
      <div>
        <div className="who">
          <Link href={`/profil/${username}`} className="link" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Avatar username={username} name={display_name} />
            <b>{display_name}</b>
          </Link>
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
      </div>
    </article>
  );
}
