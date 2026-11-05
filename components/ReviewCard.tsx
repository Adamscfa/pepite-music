import Link from "next/link";
import { getCurrentProfile, type Review } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import Avatar from "./Avatar";
import CommentForm from "./CommentForm";
import Cover from "./Cover";
import DemoBadge from "./DemoBadge";
import MentionText from "./MentionText";
import Icon from "./Icon";
import LikeButton from "./LikeButton";
import ReportButton from "./ReportButton";
import ShareButton from "./ShareButton";
import Stars from "./Stars";

// Un avis publié : l'auteur, la pochette, la note, le texte, puis les actions.
// Dans le fil (withComments), on montre aussi les derniers commentaires et un champ pour répondre.
export default async function ReviewCard({
  review,
  canLike,
  withComments = false,
}: {
  review: Review;
  canLike: boolean;
  withComments?: boolean;
}) {
  const me = await getCurrentProfile();
  const album = `/album/${review.album_id}`;
  const target = review.track_id ? `/titre/${review.track_id}` : album;
  const title = review.track_title ?? review.album_title;
  const page = `/avis/${review.id}`;

  return (
    <article className="post">
      <header className="post-head">
        <Link href={`/profil/${review.profile.username}`} className="post-author">
          <Avatar user={review.profile} />
          <span>
            <b>
              {review.profile.display_name} <DemoBadge show={review.profile.is_demo} />
            </b>
            <small>
              {timeAgo(review.updated_at)} · {review.track_id ? "a noté un titre" : "a noté un album"}
            </small>
          </span>
        </Link>
        {me && me.id !== review.user_id && <ReportButton reviewId={review.id} />}
      </header>

      <div className="post-body">
        <Link href={target} aria-label={title} className="post-cover">
          <Cover src={review.cover_url} size="l" />
        </Link>
        <div className="post-text">
          <span className="kind">{review.track_id ? "Titre" : "Album"}</span>
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
          <Stars value={review.rating} heart={review.heart} />
          {review.body && <p>{review.body}</p>}
        </div>
      </div>

      <ReviewMeta review={review} canLike={canLike} />

      {withComments && (
        <div className="post-comments">
          <div className="post-comments-head">
            <Link href={`${page}#commentaires`} className="link-under">
              <Icon name="comment" size={17} /> Commentaires ({review.comments})
            </Link>
            {review.comments > review.preview.length && (
              <Link href={`${page}#commentaires`} className="more-link">
                Tout voir →
              </Link>
            )}
          </div>
          {review.preview.map((c) => (
            <div className="mini-comment" key={c.id}>
              <Avatar user={c.profile} />
              <div>
                <div className="comment-head">
                  <Link href={`/profil/${c.profile.username}`} className="link-under">
                    <b>{c.profile.display_name}</b>
                  </Link>
                  <DemoBadge show={c.profile.is_demo} />
                  <span>{timeAgo(c.created_at)}</span>
                </div>
                <p className="comment-body">
                  <MentionText text={c.body} />
                </p>
                <Link href={`${page}#c-${c.id}`} className="text-btn">
                  Répondre
                </Link>
              </div>
            </div>
          ))}
          {me && <CommentForm reviewId={review.id} me={me} />}
        </div>
      )}
    </article>
  );
}

// Barre d'actions d'un avis : j'aime, commentaires, partage (qui propose aussi WhatsApp).
export function ReviewMeta({ review, canLike }: { review: Review; canLike: boolean }) {
  const page = `/avis/${review.id}`;
  return (
    <div className="post-actions">
      <LikeButton reviewId={review.id} likes={review.likes} liked={review.liked} canLike={canLike} />
      <Link href={`${page}#commentaires`} className="action">
        <Icon name="comment" size={20} /> {review.comments}
      </Link>
      <ShareButton title={review.track_title ?? review.album_title} path={page} compact />
    </div>
  );
}
