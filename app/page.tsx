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
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/server-locale";

export default async function FeedPage({ searchParams }: PageProps<"/">) {
  const [me, locale] = await Promise.all([getCurrentProfile(), getLocale()]);
  const tx = (key: Parameters<typeof t>[1]) => t(locale, key);
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
      title: tx("welcome"),
      text: tx("welcomeText"),
      cta: me
        ? { href: "/explorer", label: tx("exploreNow") }
        : { href: "/connexion?mode=inscription", label: tx("createAccount") },
      covers: topAlbums.slice(0, 5).map((a) => a.cover),
    },
    {
      title: tx("weeklyReleases"),
      text: tx("weeklyReleasesText"),
      cta: { href: "/explorer#nouveautes", label: tx("seeNewReleases") },
      covers: newReleases.slice(0, 5).map((a) => a.cover),
    },
    {
      title: tx("trendingNow"),
      text: locale === "fr" ? `Ce qui s'écoute le plus ${trends.label}, et ailleurs dans le monde.` : "What people are listening to here and around the world.",
      cta: { href: "/classements", label: tx("seeCharts") },
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
              <b>{tx("finishOnboarding")}</b>
              <small>{tx("finishOnboardingText")}</small>
            </span>
            <span className="more-link">{tx("start")}</span>
          </Link>
        )}
        {slides.length > 0 && <HeroSlider slides={slides} />}
        {/* Ces blocs arrivent juste après le reste de la page, sans la retarder. */}
        <Suspense fallback={<MobileHighlightsSkeleton />}>
          <MobileHighlights />
        </Suspense>

        <div className="feed-head">
          <h2 className="section-title" style={{ margin: 0 }}>
            {followingOnly ? tx("followingFeed") : tx("communityFeed")}
          </h2>
          {me && (
            <div className="tabs" style={{ margin: 0 }}>
              <Link href="/" aria-current={followingOnly ? undefined : "page"}>
                {tx("everyone")}
              </Link>
              <Link href="/?fil=abonnements" aria-current={followingOnly ? "page" : undefined}>
                {tx("myFollowing")}
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
              ? tx("emptyFollowing")
              : tx("emptyFeed")}
          </div>
        )}
      </div>
      <Suspense fallback={<RightRailSkeleton />}>
        <RightRail />
      </Suspense>
    </div>
  );
}
