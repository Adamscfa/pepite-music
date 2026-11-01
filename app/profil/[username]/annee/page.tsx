import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import Cover from "@/components/Cover";
import ShareButton from "@/components/ShareButton";
import Stars from "@/components/Stars";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getCurrentProfile, getProfileByUsername, getUserReviews } from "@/lib/data";
import { formatScore } from "@/lib/format";

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

type Props = PageProps<"/profil/[username]/annee">;

async function load(params: Props["params"], searchParams: Props["searchParams"]) {
  const profile = await getProfileByUsername(decodeURIComponent((await params).username));
  if (!profile) notFound();
  const thisYear = new Date().getFullYear();
  const asked = Number((await searchParams).annee);
  const year = Number.isInteger(asked) && asked > 2000 && asked <= thisYear ? asked : thisYear;
  return { profile, year };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { profile, year } = await load(params, searchParams);
  return { title: `L'année ${year} de ${profile.display_name} en musique` };
}

// « Ton année en musique » : le bilan des notes d'un membre sur une année.
export default async function YearPage({ params, searchParams }: Props) {
  const { profile, year } = await load(params, searchParams);
  const [me, all] = await Promise.all([getCurrentProfile(), getUserReviews(profile.id)]);
  const isMe = me?.id === profile.id;
  const when = (r: (typeof all)[number]) => new Date(r.created_at ?? r.updated_at);
  const years = [...new Set(all.map((r) => when(r).getFullYear()))].sort((a, b) => b - a);
  const reviews = all.filter((r) => when(r).getFullYear() === year);

  const owner = isMe ? "Ton" : `L'`;
  if (!reviews.length) {
    return (
      <div className="wrapped-empty">
        <Link href={`/profil/${profile.username}`} className="small link-under">
          ← Profil de {profile.display_name}
        </Link>
        <div className="empty" style={{ marginTop: 16 }}>
          {isMe
            ? `Tu n'as encore rien noté en ${year}. Note des albums et reviens voir ton bilan !`
            : `${profile.display_name} n'a encore rien noté en ${year}.`}
        </div>
      </div>
    );
  }

  const albums = reviews.filter((r) => !r.track_id).length;
  const average = reviews.reduce((n, r) => n + r.rating, 0) / reviews.length;
  const hearts = reviews.filter((r) => r.heart).length;
  const likes = reviews.reduce((n, r) => n + r.likes, 0);
  const comments = reviews.reduce((n, r) => n + r.comments, 0);
  const top = [...reviews]
    .sort((a, b) => b.rating - a.rating || Number(b.heart) - Number(a.heart) || b.likes - a.likes)
    .slice(0, 5);
  const count = <T,>(items: T[]) => {
    const map = new Map<T, number>();
    items.forEach((i) => map.set(i, (map.get(i) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1])[0];
  };
  const [artist, artistCount] = count(reviews.map((r) => r.artist_name));
  const [month] = count(reviews.map((r) => when(r).getMonth()));
  const [favRating] = count(reviews.map((r) => r.rating));
  const page = `/profil/${profile.username}/annee?annee=${year}`;

  return (
    <div className="wrapped">
      <Link href={`/profil/${profile.username}`} className="small link-under">
        ← Profil de {profile.display_name}
      </Link>

      <section className="wrapped-hero">
        <Avatar user={profile} big />
        <div>
          <div className="eyebrow">{owner === "Ton" ? "Ton année" : `L'année de ${profile.display_name}`} en musique</div>
          <h1>{year}</h1>
          <p>
            {reviews.length} note{reviews.length > 1 ? "s" : ""} sur Pépite, dont {albums} album{albums > 1 ? "s" : ""}{" "}
            et {reviews.length - albums} titre{reviews.length - albums > 1 ? "s" : ""}.
          </p>
        </div>
      </section>

      <div className="wrapped-stats">
        <div>
          <b>{formatScore(average)}</b>
          <span>note moyenne</span>
        </div>
        <div>
          <b>{"★".repeat(favRating)}</b>
          <span>la note donnée le plus souvent</span>
        </div>
        <div>
          <b>{hearts}</b>
          <span>coup{hearts > 1 ? "s" : ""} de cœur</span>
        </div>
        <div>
          <b>{likes}</b>
          <span>« j&apos;aime » reçus</span>
        </div>
        <div>
          <b>{comments}</b>
          <span>commentaires reçus</span>
        </div>
        <div>
          <b className="cap">{MONTHS[month]}</b>
          <span>le mois le plus actif</span>
        </div>
      </div>

      <section className="wrapped-artist">
        <div className="eyebrow">Artiste de l&apos;année</div>
        <h2>{artist}</h2>
        <p className="small">
          noté{artistCount > 1 ? ` ${artistCount} fois` : " une fois"}
        </p>
      </section>

      <section>
        <h2 className="section-title">Le top 5 de l&apos;année</h2>
        <ol className="wrapped-top">
          {top.map((r, i) => (
            <li key={r.id}>
              <span className="rank-n">{i + 1}</span>
              <Link href={r.track_id ? `/titre/${r.track_id}` : `/album/${r.album_id}`} className="rank-item">
                <Cover src={r.cover_url} size="s" />
                <span className="rank-text">
                  <b>{r.track_title ?? r.album_title}</b>
                  <small>{r.artist_name}</small>
                </span>
              </Link>
              <Stars value={r.rating} heart={r.heart} />
            </li>
          ))}
        </ol>
      </section>

      <div className="row" style={{ justifyContent: "flex-start", marginTop: 20 }}>
        <WhatsAppButton
          path={page}
          text={`${isMe ? "Mon" : `L'`} année ${year} en musique${isMe ? "" : ` de ${profile.display_name}`} sur Pépite : ${reviews.length} notes, artiste de l'année ${artist} 🎧`}
        />
        <ShareButton title={`L'année ${year} de ${profile.display_name} en musique`} path={page} />
      </div>

      {years.length > 1 && (
        <nav className="genres" aria-label="Autres années" style={{ marginTop: 20 }}>
          {years.map((y) => (
            <Link key={y} href={`/profil/${profile.username}/annee?annee=${y}`} className="chip" aria-current={y === year ? "page" : undefined}>
              {y}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
