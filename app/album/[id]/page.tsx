import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import Cover from "@/components/Cover";
import Stars from "@/components/Stars";
import { getAlbumReviews, getCurrentProfile } from "@/lib/data";
import { getAlbum } from "@/lib/deezer";
import { formatScore, timeAgo } from "@/lib/format";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import RatingForm from "../RatingForm";
import TrackList from "../TrackList";

async function loadAlbum(params: PageProps<"/album/[id]">["params"]) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const album = await getAlbum(id);
  if (!album) notFound();
  return album;
}

export async function generateMetadata({ params }: PageProps<"/album/[id]">): Promise<Metadata> {
  const album = await loadAlbum(params);
  return { title: `${album.title} – ${album.artist}` };
}

export default async function AlbumPage({ params }: PageProps<"/album/[id]">) {
  const album = await loadAlbum(params);
  const [reviews, me] = await Promise.all([getAlbumReviews(album.id), getCurrentProfile()]);

  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const counts = [5, 4, 3, 2, 1].map((n) => [n, reviews.filter((r) => r.rating === n).length]);
  const max = Math.max(1, ...counts.map(([, c]) => c));
  const mine = me ? reviews.find((r) => r.profile.username === me.username) : undefined;

  return (
    <>
      <div className="album-top">
        <Cover src={album.cover} size="l" alt={`Pochette de ${album.title}`} />
        <div>
          <div className="eyebrow">Album{album.genre ? ` · ${album.genre}` : ""}</div>
          <h1>{album.title}</h1>
          <div className="artist">{album.artist}</div>
          <div className="facts">
            {album.year ? `${album.year} · ` : ""}
            {album.trackCount} titre{album.trackCount > 1 ? "s" : ""}
          </div>
          <div className="score">
            <div>
              <div className="big">{reviews.length ? formatScore(average) : "–"}</div>
              <Stars value={Math.round(average)} />
              <div className="small">
                {reviews.length} note{reviews.length > 1 ? "s" : ""}
              </div>
            </div>
            <div className="dist" aria-label="Répartition des notes">
              {counts.map(([n, c]) => (
                <div key={n}>
                  <span>{n}</span>
                  <span className="bar">
                    <i style={{ width: `${(c / max) * 100}%` }} />
                  </span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="cols">
        <div>
          {me ? (
            <RatingForm
              key={mine?.id ?? "new"}
              albumId={album.id}
              initialRating={mine?.rating ?? 0}
              initialBody={mine?.body ?? ""}
            />
          ) : (
            <div className="box rate">
              <h2>Ta note</h2>
              <p className="small" style={{ marginTop: 0 }}>
                {hasSupabaseConfig
                  ? "Connecte-toi pour noter cet album et écrire ton avis."
                  : "Branche Supabase (voir le README) pour pouvoir noter."}
              </p>
              {hasSupabaseConfig && (
                <Link href="/connexion" className="btn">
                  Se connecter
                </Link>
              )}
            </div>
          )}

          <section>
            <h2 className="section-title" style={{ marginTop: 28 }}>
              Avis des membres
            </h2>
            <div className="album-reviews">
              {reviews.length ? (
                reviews.map((r) => (
                  <div className="mini" key={r.id}>
                    <div className="who">
                      <Link href={`/profil/${r.profile.username}`} className="link" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <Avatar username={r.profile.username} name={r.profile.display_name} />
                        <b>{r.profile.display_name}</b>
                      </Link>
                      <Stars value={r.rating} /> · {timeAgo(r.updated_at)}
                    </div>
                    {r.body && <p>{r.body}</p>}
                  </div>
                ))
              ) : (
                <p className="small">Pas encore d&apos;avis. Sois le premier !</p>
              )}
            </div>
          </section>
        </div>
        <TrackList tracks={album.tracks} />
      </div>
    </>
  );
}
