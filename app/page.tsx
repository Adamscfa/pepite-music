import ReviewCard from "@/components/ReviewCard";
import { getRecentReviews } from "@/lib/data";

export default async function FeedPage() {
  const reviews = await getRecentReviews();
  return (
    <>
      <div className="feed-head">
        <div>
          <div className="eyebrow">Fil d&apos;actualité</div>
          <h1>Ce que la communauté écoute</h1>
        </div>
        <span className="small">
          {reviews.length} avis récent{reviews.length > 1 ? "s" : ""}
        </span>
      </div>
      {reviews.length ? (
        <div className="feed">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="empty">
          Aucun avis pour l&apos;instant. Cherche un album en haut de la page et donne la première
          note !
        </div>
      )}
    </>
  );
}
