import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppPanel from "@/components/AppPanel";
import InviteCard from "@/components/InviteCard";
import Avatar from "@/components/Avatar";
import Cover from "@/components/Cover";
import DemoBadge from "@/components/DemoBadge";
import ListCard from "@/components/ListCard";
import Stars from "@/components/Stars";
import { removeFavorite, toggleBlock, toggleFollow } from "@/app/social-actions";
import {
  areFriends,
  getCurrentProfile,
  getFavorites,
  getFollowStats,
  getBlockedIds,
  getMyReferrals,
  getProfileByUsername,
  getSharedRatings,
  getUserLists,
  getUserReviews,
} from "@/lib/data";
import { formatScore } from "@/lib/format";
import EditProfile from "../EditProfile";
import DeleteAccount from "../DeleteAccount";
import NewList from "../NewList";
import { getLocale } from "@/lib/server-locale";

async function loadProfile(params: PageProps<"/profil/[username]">["params"]) {
  const requestedUsername = decodeURIComponent((await params).username);
  const profile = await getProfileByUsername(requestedUsername);
  if (!profile) notFound();
  if (requestedUsername !== profile.username) redirect(`/profil/${profile.username}`);
  return profile;
}

export async function generateMetadata({ params }: PageProps<"/profil/[username]">): Promise<Metadata> {
  const profile = await loadProfile(params);
  const title = `${profile.display_name} (@${profile.username})`;
  return { title, description: profile.bio || `Les albums notés par ${profile.display_name} sur Pépite.` };
}

export default async function ProfilePage({ params }: PageProps<"/profil/[username]">) {
  const profile = await loadProfile(params);
  const [me, locale] = await Promise.all([getCurrentProfile(), getLocale()]);
  const isMe = me?.id === profile.id;
  // Membre que j'ai bloqué : ses avis sont cachés, on propose de le débloquer.
  const iBlock = !isMe && (await getBlockedIds()).has(profile.id);
  const [reviews, favorites, lists, follow, taste] = await Promise.all([
    getUserReviews(profile.id),
    getFavorites(profile.id),
    getUserLists(profile.id),
    getFollowStats(profile.id, me?.id),
    me && !isMe ? getSharedRatings(me.id, profile.id) : null,
  ]);
  // Amis = l'un des deux est abonné à l'autre.
  const friends = me && !isMe ? await areFriends(me.id, profile.id) : false;
  const followsMe = friends && !follow.iFollow;
  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <>
      <div className={`prof ${isMe ? "prof-owner" : ""}`}>
        {isMe ? (
          <>
            <EditProfile user={profile} bio={profile.bio} locale={locale} />
            <div className="prof-owner-meta">
              <h1 className="sr-only">{profile.display_name}</h1>
              <div className="eyebrow">@{profile.username}</div>
              <Link href={`/profil/${profile.username}/annee`} className="year-link">
                <MusicYearIcon />
                <span>Mon année {new Date().getFullYear()} en musique</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </>
        ) : (
          <>
            <Avatar user={profile} big />
            <div className="prof-id">
              <div className="eyebrow">@{profile.username}</div>
              <h1>
                {profile.display_name} <DemoBadge show={profile.is_demo} />
              </h1>
            </div>
            <div className="prof-more">
              {profile.bio && <p>{profile.bio}</p>}
              {profile.is_demo && (
                <p className="small">Membre de démonstration : ce compte et ses avis sont imaginaires.</p>
              )}
              <Link href={`/profil/${profile.username}/annee`} className="year-link">
                <MusicYearIcon />
                <span>Son année {new Date().getFullYear()} en musique</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </>
        )}
        {me && !isMe && iBlock && (
          <div className="prof-actions">
            <form action={toggleBlock}>
              <input type="hidden" name="user_id" value={profile.id} />
              <input type="hidden" name="block" value="0" />
              <button className="btn ghost">Débloquer</button>
            </form>
          </div>
        )}
        {me && !isMe && !iBlock && (
          <div className="prof-actions">
            <form action={toggleFollow}>
              <input type="hidden" name="user_id" value={profile.id} />
              <input type="hidden" name="follow" value={follow.iFollow ? "0" : "1"} />
              <button className={follow.iFollow ? "btn ghost" : "btn"}>
                {follow.iFollow ? "Abonné ✓" : followsMe ? "S'abonner en retour" : "S'abonner"}
              </button>
            </form>
            {friends && (
              <Link href={`/messages/${profile.username}`} className="btn ghost">
                ✉ Message
              </Link>
            )}
            <details className="report more-menu">
              <summary className="icon-round" aria-label="Plus d'actions" title="Plus d'actions">
                ⋯
              </summary>
              <form action={toggleBlock} className="report-box">
                <input type="hidden" name="user_id" value={profile.id} />
                <input type="hidden" name="block" value="1" />
                <p className="small" style={{ margin: 0 }}>
                  Tu ne verras plus ses avis ni ses commentaires, et vous ne pourrez plus vous écrire.
                </p>
                <button className="btn danger-btn">Bloquer {profile.display_name}</button>
              </form>
            </details>
          </div>
        )}
      </div>

      {iBlock && (
        <p className="notice" style={{ marginTop: 16 }}>
          Tu as bloqué {profile.display_name} : tu ne vois plus ses avis ni ses commentaires.
        </p>
      )}

      <div className="stats">
        <div>
          <b>{reviews.length}</b>
          <span>note{reviews.length > 1 ? "s" : ""}</span>
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

      {taste && (
        <section className="box taste" style={{ marginTop: 26 }}>
          <div className="taste-head">
            <div className="taste-score" style={{ "--p": taste.match ?? 0 } as React.CSSProperties}>
              <b>{taste.match === null ? "?" : `${taste.match} %`}</b>
            </div>
            <div>
              <h2 className="section-title" style={{ margin: 0 }}>
                Vos goûts en commun
              </h2>
              <p className="small" style={{ margin: "4px 0 0" }}>
                {taste.shared.length
                  ? `Calculé sur ${taste.shared.length} album${taste.shared.length > 1 ? "s" : ""} ou titre${taste.shared.length > 1 ? "s" : ""} que vous avez notés tous les deux.`
                  : `Vous n'avez encore rien noté en commun. Notez les mêmes albums pour voir votre compatibilité !`}
              </p>
            </div>
          </div>
          {taste.shared.length > 0 && (
            <>
              <h3
                className="small"
                style={{
                  margin: "16px 0 8px",
                  fontFamily: "var(--mono)",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                }}
              >
                Écoutés tous les deux
              </h3>
              <div className="shared">
                {taste.shared.map((x) => (
                  <Link
                    key={`${x.album_id}-${x.track_id}`}
                    href={x.track_id ? `/titre/${x.track_id}` : `/album/${x.album_id}`}
                    className="shared-row"
                  >
                    <Cover src={x.cover_url} size="s" />
                    <span className="shared-title">
                      <b>{x.title}</b>
                      <small>{x.artist_name}</small>
                    </span>
                    <span className="shared-notes">
                      <span>
                        <small>Toi</small>
                        <Stars value={x.mine} />
                      </span>
                      <span>
                        <small>{profile.display_name}</small>
                        <Stars value={x.theirs} />
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {isMe && (
        <div style={{ marginTop: 20 }}>
          <InviteCard username={profile.username} displayName={profile.display_name} invited={await getMyReferrals(profile.id)} />
        </div>
      )}
      {isMe && (
        <div style={{ marginTop: 20 }}>
          <AppPanel variant="card" loggedIn />
        </div>
      )}

      <section style={{ marginTop: 30 }} id="favoris">
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

      <section id="notes">
        <h2 className="section-title">{isMe ? "Mes notes récentes" : "Notes récentes"}</h2>
        {reviews.length ? (
          <div className="grid-rated">
            {reviews.map((r) => (
              <Link key={r.id} href={`/avis/${r.id}`}>
                <Cover src={r.cover_url} size="l" />
                <Stars value={r.rating} heart={r.heart} />
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

      {isMe && (
        <section className="account-zone">
          <nav className="site-links" aria-label="Informations">
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/conditions">Conditions</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/reglages/bloques">Membres bloqués</Link>
          </nav>
          <DeleteAccount username={profile.username} />
        </section>
      )}
    </>
  );
}

function MusicYearIcon() {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="7" r="5" />
      <circle cx="9" cy="5.6" r="1.5" fill="currentColor" stroke="none" />
      <path d="M5.5 10.2c.4-1.6 1.5-2.5 3.5-2.5s3.1.9 3.5 2.5" fill="currentColor" stroke="none" />
      <path d="M2.5 24h23" />
      <path d="M5 22v-4h3v4m3 0v-7h3v7m3 0v-5h3v5" />
      <path d="m4 16 6-4 4 2 7-7m-4 0h4v4" />
    </svg>
  );
}
