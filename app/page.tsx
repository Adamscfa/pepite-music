import AlbumGrid from "@/components/AlbumGrid";
import ReviewCard from "@/components/ReviewCard";
import { getRecentReviews } from "@/lib/data";
import { getTopAlbums } from "@/lib/deezer";

export default async function FeedPage() {
  const [reviews, topAlbums] = await Promise.all([getRecentReviews(), getTopAlbums()]);
  return (
    <>
      {topAlbums.length > 0 && (
        <section className="discover">
          <div className="feed-head">
            <div>
              <div className="eyebrow">À découvrir</div>
              <h2 className="section-title" style={{ margin: 0 }}>
                Les albums du moment
              </h2>
            </div>
            <span className="small">Clique sur un album pour le noter</span>
          </div>
          <AlbumGrid albums={topAlbums} />
        </section>
      )}

      <section>
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
            Aucun avis pour l&apos;instant. Choisis un album plus haut ou cherche-le en haut de la
            page, et donne la première note !
          </div>
        )}
      </section>
    </>
  );
}
