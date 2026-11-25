import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/Avatar";
import DemoBadge from "@/components/DemoBadge";
import { toggleFollow } from "@/app/social-actions";
import { getCurrentProfile, getSuggestedMembers } from "@/lib/data";
import { getChart, getGenres, getTopAlbums, type AlbumHit } from "@/lib/deezer";
import { saveGenres } from "./actions";
import ClaimInvite from "./ClaimInvite";
import RateStep from "./RateStep";
import InstallStep from "./InstallStep";
import { sharpImage } from "@/lib/images";
import { getLocale } from "@/lib/server-locale";
import { t, type Locale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: t(await getLocale(), "welcomeEyebrow") };
}

const STEP_KEYS = [
  "onboardingStepGenres",
  "onboardingStepRatings",
  "onboardingStepMembers",
  "onboardingStepPhone",
] as const;

// Premier pas après l'inscription : choisir ses genres, noter 3 albums, suivre des membres.
export default async function WelcomePage({ searchParams }: PageProps<"/bienvenue">) {
  const [me, locale] = await Promise.all([getCurrentProfile(), getLocale()]);
  if (!me) redirect("/connexion?mode=inscription");
  const step = Math.min(4, Math.max(1, Number((await searchParams).etape) || 1));

  return (
    <div className="onboard">
      <ClaimInvite locale={locale} />
      <div className="eyebrow">{t(locale, "welcomePersonalized").replace("{name}", me.display_name)}</div>
      <ol className="onboard-steps">
        {STEP_KEYS.map((key, i) => (
          <li key={key} aria-current={step === i + 1 ? "step" : undefined} className={step > i + 1 ? "done" : undefined}>
            <span>{i + 1}</span> {t(locale, key)}
          </li>
        ))}
      </ol>
      {step === 1 && <GenresStep chosen={me.favorite_genres ?? []} locale={locale} />}
      {step === 2 && <AlbumsStep genres={me.favorite_genres ?? []} locale={locale} />}
      {step === 3 && <MembersStep locale={locale} />}
      {step === 4 && <InstallStep locale={locale} />}
    </div>
  );
}

async function GenresStep({ chosen, locale }: { chosen: number[]; locale: Locale }) {
  const genres = await getGenres();
  return (
    <form action={saveGenres}>
      <h1>{t(locale, "genresQuestion")}</h1>
      <p className="small">{t(locale, "genresInstruction")}</p>
      <div className="genre-pick">
        {genres.map((g) => (
          <label key={g.id} className="genre-card pickable">
            <input type="checkbox" name="genre" value={g.id} defaultChecked={chosen.includes(g.id)} />
            <img {...sharpImage(g.picture, "(max-width: 760px) 50vw, 200px")} alt="" loading="lazy" />
            <span>{g.name}</span>
          </label>
        ))}
      </div>
      <div className="onboard-actions">
        <Link href="/bienvenue?etape=2" className="text-btn">
          {t(locale, "skip")}
        </Link>
        <button className="btn">{t(locale, "continue")}</button>
      </div>
    </form>
  );
}

async function AlbumsStep({ genres, locale }: { genres: number[]; locale: Locale }) {
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
      <h1>{t(locale, "firstAlbumsTitle")}</h1>
      <p className="small">{t(locale, "firstAlbumsInstruction")}</p>
      <RateStep albums={albums} locale={locale} />
    </>
  );
}

async function MembersStep({ locale }: { locale: Locale }) {
  const me = await getCurrentProfile();
  const members = me ? await getSuggestedMembers(me) : [];
  const tx = (key: Parameters<typeof t>[1]) => t(locale, key);
  return (
    <>
      <h1>{tx("membersToFollowTitle")}</h1>
      <p className="small">{tx("membersToFollowInstruction")}</p>
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
                    {m.count} {tx("reviews")}
                    {m.shared
                      ? tx(m.shared === 1 ? "sharedGenreLabel" : "sharedGenresLabel").replace("{count}", String(m.shared))
                      : ""}
                  </small>
                </span>
              </Link>
              {m.bio && <p className="small">{m.bio}</p>}
              <form action={toggleFollow}>
                <input type="hidden" name="user_id" value={m.id} />
                <input type="hidden" name="follow" value="1" />
                <button className="btn">{tx("followAction")}</button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty">{tx("noSuggestedMembers")}</p>
      )}
      <div className="onboard-actions">
        <Link href="/bienvenue?etape=4" className="btn big-btn">
          {tx("continue")}
        </Link>
      </div>
    </>
  );
}
