import Link from "next/link";
import HeroSlider, { type Slide } from "@/components/HeroSlider";
import Icon from "@/components/Icon";
import LoadMore from "@/components/LoadMore";
import MobileHighlights from "@/components/MobileHighlights";
import ReviewCard from "@/components/ReviewCard";
import RightRail from "@/components/RightRail";
import { getCurrentProfile, getRecentReviews } from "@/lib/data";
import { getNewReleases } from "@/lib/deezer";
import { getHomeTrends } from "@/lib/home";
import { Suspense } from "react";
import { MobileHighlightsSkeleton, RightRailSkeleton } from "@/components/HomeSkeletons";

export default async function FeedPage({ searchParams }: PageProps<"/">) {
  const me = await getCurrentProfile();
  const params = await searchParams;
  const followingOnly = Boolean(me) && params.fil === "abonnements";
  // Le fil se charge par paquets de 15 avis (plus léger sur une connexion 4G).
  const PAGE = 15;
  const shown = Math.min(150, Math.max(PAGE, Number(params.n) || PAGE));
  const [reviews, trends, newReleases] = await Promise.all([
    getRecentReviews({ followedBy: followingOnly ? me!.id : undefined, limit: shown }),
    getHomeTrends(),
    getNewReleases(6),
  ]);

  const topAlbums = trends.albums;
  const slides: Slide[] = [
    {
      title: "Bienvenue sur Pépite !",
      text: "Découvre, note et commente tes albums et titres préférés, et vois ce que la communauté écoute.",
      cta: me
        ? { href: "/explorer", label: "Explorer maintenant" }
        : { href: "/connexion?mode=inscription", label: "Créer mon compte" },
      covers: topAlbums.slice(0, 5).map((a) => a.cover),
    },
    {
      title: "Les sorties de la semaine",
      text: "Les albums qui viennent d'arriver. Sois parmi les premiers à donner ton avis.",
      cta: { href: "/explorer#nouveautes", label: "Voir les nouveautés" },
      covers: newReleases.slice(0, 5).map((a) => a.cover),
    },
    {
      title: "Les tops du moment",
      text: `Ce qui s'écoute le plus ${trends.label}, et ailleurs dans le monde.`,
      cta: { href: "/classements", label: "Voir les classements" },
      covers: topAlbums.slice(5, 10).map((a) => a.cover),
    },
    // Le premier bandeau reste toujours ; les autres seulement si Deezer a répondu.
  ].filter((s, i) => i === 0 || s.covers.length > 0);

  return (
    <div className="with-rail">
      <div className="feed-col">
        {me?.onboarded === false && (
          <Link href="/bienvenue" className="onboard-banner">
            <Icon name="sparkle" size={24} />
            <span>
              <b>Termine ton arrivée sur Pépite</b>
              <small>Choisis tes genres, note 3 albums et trouve des membres à suivre. Ça prend une minute.</small>
            </span>
            <span className="more-link">C&apos;est parti →</span>
          </Link>
        )}
        {slides.length > 0 && <HeroSlider slides={slides} />}
        {/* Ces blocs arrivent juste après le reste de la page, sans la retarder. */}
        <Suspense fallback={<MobileHighlightsSkeleton />}>
          <MobileHighlights />
        </Suspense>

        <div className="feed-head">
          <h2 className="section-title" style={{ margin: 0 }}>
            {followingOnly ? "Ce que tes abonnements écoutent" : "Ce que la communauté écoute"}
          </h2>
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
              <ReviewCard key={review.id} review={review} canLike={Boolean(me)} withComments />
            ))}
            {reviews.length >= shown - 5 && shown < 150 && (
              <LoadMore href={`/?${followingOnly ? "fil=abonnements&" : ""}n=${shown + PAGE}`} />
            )}
          </div>
        ) : (
          <div className="empty">
            {followingOnly
              ? "Rien pour l'instant. Abonne-toi à des membres depuis leur profil pour voir leurs avis ici."
              : "Aucun avis pour l'instant. Cherche un album en haut de la page, ou va dans Explorer, et donne la première note !"}
          </div>
        )}
      </div>
      <Suspense fallback={<RightRailSkeleton />}>
        <RightRail />
      </Suspense>
    </div>
  );
}
