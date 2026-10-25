import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import Cover from "@/components/Cover";
import ListCard from "@/components/ListCard";
import Stars from "@/components/Stars";
import { removeFavorite, toggleFollow } from "@/app/social-actions";
import {
  getCurrentProfile,
  getFavorites,
  getFollowStats,
  getProfileByUsername,
  getUserLists,
  getUserReviews,
} from "@/lib/data";
import { formatScore } from "@/lib/format";
import EditProfile from "../EditProfile";
import NewList from "../NewList";

async function loadProfile(params: PageProps<"/profil/[username]">["params"]) {
  const profile = await getProfileByUsername(decodeURIComponent((await params).username));
  if (!profile) notFound();
  return profile;
}

export async function generateMetadata({ params }: PageProps<"/profil/[username]">): Promise<Metadata> {
  const profile = await loadProfile(params);
  const title = `${profile.display_name} (@${profile.username})`;
  return { title, description: profile.bio || `Les albums notés par ${profile.display_name} sur Pépite.` };
}

export default async function ProfilePage({ params }: PageProps<"/profil/[username]">) {
  const profile = await loadProfile(params);
  const me = await getCurrentProfile();
  const [reviews, favorites, lists, follow] = await Promise.all([
    getUserReviews(profile.id),
    getFavorites(profile.id),
    getUserLists(profile.id),
    getFollowStats(profile.id, me?.id),
  ]);
  const isMe = me?.id === profile.id;
  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <>
      <div className="prof">
        <Avatar user={profile} big />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="eyebrow">@{profile.username}</div>
          <h1>{profile.display_name}</h1>
          {profile.bio ? <p>{profile.bio}</p> : isMe && <p>Ajoute une bio et une photo pour te présenter.</p>}
        </div>
        {me && !isMe && (
          <form action={toggleFollow}>
            <input type="hidden" name="user_id" value={profile.id} />
            <input type="hidden" name="follow" value={follow.iFollow ? "0" : "1"} />
            <button className={follow.iFollow ? "btn ghost" : "btn"}>{follow.iFollow ? "Abonné ✓" : "S'abonner"}</button>
          </form>
        )}
      </div>

      <div className="stats">
        <div>
          <b>{reviews.length}</b>
          <span>album{reviews.length > 1 ? "s" : ""} noté{reviews.length > 1 ? "s" : ""}</span>
        </div>
        <div>
          <b>{reviews.length ? formatScore(average) : "–"}</b>
          <span>note moyenne</span>
        </div>
        <div>
          <b>{follow.followers}</b>
          <span>abonné{follow.followers > 1 ? "s" : ""}</span>
        </div>
        <div>
          <b>{follow.following}</b>
          <span>abonnement{follow.following > 1 ? "s" : ""}</span>
        </div>
      </div>

      {isMe && <EditProfile displayName={profile.display_name} bio={profile.bio} hasAvatar={Boolean(profile.avatar_url)} />}

      <section style={{ marginTop: 30 }}>
        <h2 className="section-title">Albums favoris</h2>
        <div className="favs">
          {[1, 2, 3, 4].map((position) => {
            const fav = favorites.find((f) => f.position === position);
            if (!fav) {
              return (
                <div key={position} className="fav-empty">
                  {isMe ? "Ajoute un favori depuis la page d'un album" : ""}
                </div>
              );
            }
            return (
              <div key={position} className="fav">
                <Link href={`/album/${fav.album_id}`}>
                  <Cover src={fav.cover_url} size="l" alt={`Pochette de ${fav.album_title}`} />
                  <span className="album-name">{fav.album_title}</span>
                  <small>{fav.artist_name}</small>
                </Link>
                {isMe && (
                  <form action={removeFavorite}>
                    <input type="hidden" name="position" value={position} />
                    <button className="link-btn" aria-label={`Retirer ${fav.album_title} des favoris`}>
                      Retirer
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="section-title">Listes</h2>
        {isMe && <NewList />}
        {lists.length ? (
          <div className="grid-rated">
            {lists.map((list) => (
              <ListCard key={list.id} list={list} />
            ))}
          </div>
        ) : (
          <p className="small">{isMe ? "Pas encore de liste." : "Aucune liste pour l'instant."}</p>
        )}
      </section>

      <section>
        <h2 className="section-title">{isMe ? "Mes notes récentes" : "Notes récentes"}</h2>
        {reviews.length ? (
          <div className="grid-rated">
            {reviews.map((r) => (
              <Link key={r.id} href={`/avis/${r.id}`}>
                <Cover src={r.cover_url} size="l" />
                <Stars value={r.rating} />
                <small>
                  {r.track_title ? `${r.track_title} (titre)` : r.album_title} · {r.artist_name}
                </small>
              </Link>
            ))}
          </div>
        ) : (
          <p className="small">
            {isMe ? "Tu n'as encore rien noté. Cherche un album en haut de la page !" : "Aucune note pour l'instant."}
          </p>
        )}
      </section>
    </>
  );
}
