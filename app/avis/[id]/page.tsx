import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AuthorLink from "@/components/AuthorLink";
import ReviewCard from "@/components/ReviewCard";
import { deleteComment } from "@/app/social-actions";
import { getComments, getCurrentProfile, getReview } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import CommentForm from "./CommentForm";

async function loadReview(params: PageProps<"/avis/[id]">["params"]) {
  const id = Number((await params).id);
  const review = Number.isInteger(id) && id > 0 ? await getReview(id) : null;
  if (!review) notFound();
  return review;
}

export async function generateMetadata({ params }: PageProps<"/avis/[id]">): Promise<Metadata> {
  const review = await loadReview(params);
  const title = `${review.profile.display_name} a noté ${review.album_title} ${"★".repeat(review.rating)}`;
  const description = review.body ? review.body.slice(0, 160) : `${review.album_title} de ${review.artist_name}, noté sur Pépite.`;
  return { title, description, openGraph: { title, description }, twitter: { card: "summary_large_image", title, description } };
}

export default async function ReviewPage({ params }: PageProps<"/avis/[id]">) {
  const review = await loadReview(params);
  const [comments, me] = await Promise.all([getComments(review.id), getCurrentProfile()]);

  return (
    <>
      <div className="eyebrow" style={{ marginBottom: 10 }}>
        Avis
      </div>
      <ReviewCard review={review} canLike={Boolean(me)} />

      <section style={{ marginTop: 28 }}>
        <h2 className="section-title">
          {comments.length} commentaire{comments.length > 1 ? "s" : ""}
        </h2>
        {comments.map((c) => (
          <div className="mini" key={c.id}>
            <div className="who">
              <AuthorLink user={c.profile} /> · {timeAgo(c.created_at)}
              {me?.id === c.user_id && (
                <form action={deleteComment} style={{ marginLeft: "auto" }}>
                  <input type="hidden" name="comment_id" value={c.id} />
                  <button className="link-btn">Supprimer</button>
                </form>
              )}
            </div>
            <p>{c.body}</p>
          </div>
        ))}
        {me ? (
          <CommentForm reviewId={review.id} />
        ) : (
          <p className="small">
            <Link href="/connexion" className="link-btn">
              Connecte-toi
            </Link>{" "}
            pour commenter.
          </p>
        )}
      </section>
    </>
  );
}
