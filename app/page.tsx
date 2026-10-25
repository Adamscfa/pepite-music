import Link from "next/link";
import AlbumTile from "@/components/AlbumTile";
import Carousel from "@/components/Carousel";
import Cover from "@/components/Cover";
import ReviewCard from "@/components/ReviewCard";
import { getCurrentProfile, getRecentReviews, getTopRatedAlbums, getWeeklyPepite } from "@/lib/data";
import { getNewReleases, getTopAlbums } from "@/lib/deezer";
import { formatScore } from "@/lib/format";

export default async function FeedPage({ searchParams }: PageProps<"/">) {
  const me = await getCurrentProfile();
  const followingOnly = Boolean(me) && (await searchParams).fil === "abonnements";
  const [reviews, topAlbums, newReleases, topRated, weekly] = await Promise.all([
    getRecentReviews({ followedBy: followingOnly ? me!.id : undefined }),
    getTopAlbums(12),
    getNewReleases(12),
    getTopRatedAlbums(12),
    getWeeklyPepite(me?.id),
  ]);
  const pepite = weekly.current[0] ?? weekly.lastWinner;

  return (
    <>
      {!me && (
        <section className="welcome">
          <div className="welcome-covers" aria-hidden="true">
            {topAlbums.slice(0, 6).map((a, i) => (
              <img key={a.id} src={a.cover} alt="" style={{ "--i": i } as React.CSSProperties} />
            ))}
          </div>
          <div className="welcome-text">
            <div className="eyebrow">Bienvenue sur Pépite</div>
            <h1>Ton carnet de musique, à partager.</h1>
            <p>
              Note les albums et les titres que tu écoutes, de 1 à 5 étoiles. Écris ce que tu en as pensé et garde tes
              coups de cœur. Suis tes amis pour découvrir ce qu&apos;ils écoutent.
            </p>
            <div className="row" style={{ justifyContent: "flex-start" }}>
              <Link href="/connexion?mode=inscription" className="btn big-btn">
                Créer mon compte
              </Link>
              <Link href="/connexion" className="btn ghost">
                J&apos;ai déjà un compte
              </Link>
            </div>
          </div>
        </section>
      )}

      {pepite && (
        <Link href={`/album/${pepite.album_id}`} className="pepite-week">
          <Cover src={pepite.cover_url} size="m" />
          <div>
            <div className="eyebrow">
              💎 {weekly.current[0] ? "Pépite de la semaine (vote en cours)" : "Pépite de la semaine dernière"}
            </div>
            <h2>{pepite.album_title}</h2>
            <div className="small">
              {pepite.artist_name} · {pepite.votes} vote{pepite.votes > 1 ? "s" : ""}
            </div>
          </div>
          <span className="small pepite-cta">Vote depuis la page d&apos;un album →</span>
        </Link>
      )}

      {topAlbums.length > 0 && (
        <Carousel
          eyebrow="Classement Deezer"
          title="Les albums du moment"
          more={{ href: "/classements", label: "Tous les classements →" }}
        >
          {topAlbums.map((a) => (
            <AlbumTile key={a.id} id={a.id} title={a.title} subtitle={a.artist} cover={a.cover} />
          ))}
        </Carousel>
      )}

      {newReleases.length > 0 && (
        <Carousel eyebrow="Tout juste sortis" title="Nouveautés de la semaine">
          {newReleases.map((a) => (
            <AlbumTile key={a.id} id={a.id} title={a.title} subtitle={a.artist} cover={a.cover} badge="Nouveau" />
          ))}
        </Carousel>
      )}

      {topRated.length > 0 && (
        <Carousel eyebrow="Classement des membres" title="Les mieux notés sur Pépite">
          {topRated.map((a, i) => (
            <AlbumTile
              key={a.album_id}
              id={a.album_id}
              title={a.album_title}
              cover={a.cover_url}
              badge={`#${i + 1}`}
              subtitle={
                <>
                  ★ {formatScore(a.average)} · {a.count} note{a.count > 1 ? "s" : ""}
                </>
              }
            />
          ))}
        </Carousel>
      )}

      <section style={{ marginTop: 36 }}>
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
