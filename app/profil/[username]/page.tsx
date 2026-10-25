import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import Cover from "@/components/Cover";
import Stars from "@/components/Stars";
import { getCurrentProfile, getProfileByUsername, getUserReviews } from "@/lib/data";
import { formatScore } from "@/lib/format";
import EditProfile from "../EditProfile";

async function loadProfile(params: PageProps<"/profil/[username]">["params"]) {
  const profile = await getProfileByUsername(decodeURIComponent((await params).username));
  if (!profile) notFound();
  return profile;
}

export async function generateMetadata({ params }: PageProps<"/profil/[username]">): Promise<Metadata> {
  const profile = await loadProfile(params);
  return { title: `${profile.display_name} (@${profile.username})` };
}

export default async function ProfilePage({ params }: PageProps<"/profil/[username]">) {
  const profile = await loadProfile(params);
  const [reviews, me] = await Promise.all([getUserReviews(profile.id), getCurrentProfile()]);
  const isMe = me?.id === profile.id;
  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const fiveStars = reviews.filter((r) => r.rating === 5).length;

  return (
    <>
      <div className="prof">
        <Avatar username={profile.username} name={profile.display_name} />
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">@{profile.username}</div>
          <h1>{profile.display_name}</h1>
          {profile.bio ? <p>{profile.bio}</p> : isMe && <p>Ajoute une bio pour te présenter.</p>}
        </div>
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
          <b>{fiveStars}</b>
          <span>pépite{fiveStars > 1 ? "s" : ""} (5 étoiles)</span>
        </div>
      </div>

      {isMe && <EditProfile displayName={profile.display_name} bio={profile.bio} />}

      <section style={{ marginTop: 30 }}>
        <h2 className="section-title">{isMe ? "Mes notes récentes" : "Notes récentes"}</h2>
        {reviews.length ? (
          <div className="grid-rated">
            {reviews.map((r) => (
              <Link key={r.id} href={`/album/${r.album_id}`}>
                <Cover src={r.cover_url} size="l" />
                <Stars value={r.rating} />
                <small>
                  {r.album_title} · {r.artist_name}
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
