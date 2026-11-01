import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/Avatar";
import DemoBadge from "@/components/DemoBadge";
import { toggleFollow } from "@/app/social-actions";
import { getCurrentProfile, getSuggestedMembers } from "@/lib/data";
import { getChart, getGenres, getTopAlbums, type AlbumHit } from "@/lib/deezer";
import { finishOnboarding, saveGenres } from "./actions";
import RateStep from "./RateStep";

export const metadata: Metadata = { title: "Bienvenue" };

const STEPS = ["Tes genres", "Tes premières notes", "Des membres à suivre"];

// Premier pas après l'inscription : choisir ses genres, noter 3 albums, suivre des membres.
export default async function WelcomePage({ searchParams }: PageProps<"/bienvenue">) {
  const me = await getCurrentProfile();
  if (!me) redirect("/connexion?mode=inscription");
  const step = Math.min(3, Math.max(1, Number((await searchParams).etape) || 1));

  return (
    <div className="onboard">
      <div className="eyebrow">Bienvenue sur Pépite, {me.display_name} !</div>
      <ol className="onboard-steps">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={step === i + 1 ? "step" : undefined} className={step > i + 1 ? "done" : undefined}>
            <span>{i + 1}</span> {label}
          </li>
        ))}
      </ol>
      {step === 1 && <GenresStep chosen={me.favorite_genres ?? []} />}
      {step === 2 && <AlbumsStep genres={me.favorite_genres ?? []} />}
      {step === 3 && <MembersStep />}
    </div>
  );
}

async function GenresStep({ chosen }: { chosen: number[] }) {
  const genres = await getGenres();
  return (
    <form action={saveGenres}>
      <h1>Qu&apos;est-ce que tu écoutes ?</h1>
      <p className="small">Choisis de 1 à 5 genres. On s&apos;en sert pour te proposer des albums et des membres.</p>
      <div className="genre-pick">
        {genres.map((g) => (
          <label key={g.id} className="genre-card pickable">
            <input type="checkbox" name="genre" value={g.id} defaultChecked={chosen.includes(g.id)} />
            <img src={g.picture} alt="" loading="lazy" />
            <span>{g.name}</span>
          </label>
        ))}
      </div>
      <div className="onboard-actions">
        <Link href="/bienvenue?etape=2" className="text-btn">
          Passer
        </Link>
        <button className="btn">Continuer →</button>
      </div>
    </form>
  );
}

async function AlbumsStep({ genres }: { genres: number[] }) {
  // Les albums du moment dans les genres choisis (ou en général, si aucun genre).
  const lists = genres.length ? await Promise.all(genres.map((g) => getChart(g))) : [];
  const seen = new Set<number>();
  const albums: AlbumHit[] = [];
  const per = genres.length ? Math.ceil(12 / genres.length) : 0;
  for (const list of lists) {
    for (const a of list.albums.slice(0, per + 2)) {
      if (albums.length >= 12 || seen.has(a.id)) continue;
      seen.add(a.id);
      albums.push(a);
    }
  }
  if (albums.length < 6) {
    for (const a of await getTopAlbums(12)) {
      if (albums.length >= 12 || seen.has(a.id)) continue;
      seen.add(a.id);
      albums.push(a);
    }
  }
  return (
    <>
      <h1>Note tes premiers albums</h1>
      <p className="small">
        Touche les étoiles des albums que tu connais (au moins 3). Tu pourras écrire un avis plus tard depuis la page de
        l&apos;album.
      </p>
      <RateStep albums={albums} />
    </>
  );
}

async function MembersStep() {
  const me = await getCurrentProfile();
  const members = me ? await getSuggestedMembers(me) : [];
  return (
    <>
      <h1>Suis des membres</h1>
      <p className="small">Leurs avis apparaîtront dans ton fil « Mes abonnements ». Tu peux suivre qui tu veux.</p>
      {members.length ? (
        <div className="suggest">
          {members.map((m) => (
            <div key={m.id} className="suggest-card">
              <Link href={`/profil/${m.username}`} className="post-author">
                <Avatar user={m} />
                <span>
                  <b>
                    {m.display_name} <DemoBadge show={m.is_demo} />
                  </b>
                  <small>
                    {m.count} avis{m.shared ? ` · ${m.shared} genre${m.shared > 1 ? "s" : ""} en commun` : ""}
                  </small>
                </span>
              </Link>
              {m.bio && <p className="small">{m.bio}</p>}
              <form action={toggleFollow}>
                <input type="hidden" name="user_id" value={m.id} />
                <input type="hidden" name="follow" value="1" />
                <button className="btn">Suivre</button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty">Tu suis déjà tout le monde, ou la communauté démarre tout juste !</p>
      )}
      <form action={finishOnboarding} className="onboard-actions">
        <button className="btn big-btn">C&apos;est parti →</button>
      </form>
    </>
  );
}
