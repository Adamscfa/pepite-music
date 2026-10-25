import Link from "next/link";
import AlbumGrid from "@/components/AlbumGrid";
import ReviewCard from "@/components/ReviewCard";
import { getCurrentProfile, getRecentReviews } from "@/lib/data";
import { getTopAlbums } from "@/lib/deezer";

export default async function FeedPage({ searchParams }: PageProps<"/">) {
  const me = await getCurrentProfile();
  const followingOnly = Boolean(me) && (await searchParams).fil === "abonnements";
  const [reviews, topAlbums] = await Promise.all([
    getRecentReviews({ followedBy: followingOnly ? me!.id : undefined }),
    getTopAlbums(),
  ]);

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
            <h1>{followingOnly ? "Ce que tes abonnements écoutent" : "Ce que la communauté écoute"}</h1>
          </div>
          {me && (
            <div className="tabs" style={{ margin: 0 }}>
              <Link href="/" aria-current={followingOnly ? undefined : "page"}>
                Tout le monde
              </Link>
              <Link href="/?fil=abonnements" aria-current={followingOnly ? "page" : undefined}>
                Mes abonnements
              </Link>
            </div>
          )}
        </div>
        {reviews.length ? (
          <div className="feed">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} canLike={Boolean(me)} />
            ))}
          </div>
        ) : (
          <div className="empty">
            {followingOnly
              ? "Rien pour l'instant. Abonne-toi à des membres depuis leur profil pour voir leurs avis ici."
              : "Aucun avis pour l'instant. Choisis un album plus haut ou cherche-le en haut de la page, et donne la première note !"}
          </div>
        )}
      </section>
    </>
  );
}
