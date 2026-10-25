import Link from "next/link";
import RatingForm from "@/app/album/RatingForm";
import type { Profile, Review } from "@/lib/data";
import { formatScore, timeAgo } from "@/lib/format";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import AuthorLink from "./AuthorLink";
import { ReviewMeta } from "./ReviewCard";
import Stars from "./Stars";

// Morceaux communs aux pages album et chanson.

export function ScoreSummary({ reviews }: { reviews: Review[] }) {
  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const counts = [5, 4, 3, 2, 1].map((n) => [n, reviews.filter((r) => r.rating === n).length]);
  const max = Math.max(1, ...counts.map(([, c]) => c));
  return (
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
  );
}

export function RatePanel({
  me,
  reviews,
  albumId,
  trackId,
  what,
}: {
  me: Profile | null;
  reviews: Review[];
  albumId: number;
  trackId?: number;
  what: string;
}) {
  if (!me) {
    return (
      <div className="box rate">
        <h2>Ta note</h2>
        <p className="small" style={{ marginTop: 0 }}>
          {hasSupabaseConfig
            ? `Connecte-toi pour noter ${what} et écrire ton avis.`
            : "Branche Supabase (voir le README) pour pouvoir noter."}
        </p>
        {hasSupabaseConfig && (
          <Link href="/connexion" className="btn">
            Se connecter
          </Link>
        )}
      </div>
    );
  }
  const mine = reviews.find((r) => r.user_id === me.id);
  return (
    <RatingForm
      key={`${albumId}-${trackId ?? ""}`}
      albumId={albumId}
      trackId={trackId}
      initialRating={mine?.rating ?? 0}
      initialBody={mine?.body ?? ""}
      initialHeart={mine?.heart ?? false}
    />
  );
}

export function MemberReviews({ reviews, canLike }: { reviews: Review[]; canLike: boolean }) {
  return (
    <section>
      <h2 className="section-title" style={{ marginTop: 28 }}>
        Avis des membres
      </h2>
      <div className="album-reviews">
        {reviews.length ? (
          reviews.map((r) => (
            <div className="mini" key={r.id}>
              <div className="who">
                <AuthorLink user={r.profile} />
                <Stars value={r.rating} heart={r.heart} /> · {timeAgo(r.updated_at)}
              </div>
              {r.body && <p>{r.body}</p>}
              <ReviewMeta review={r} canLike={canLike} />
            </div>
          ))
        ) : (
          <p className="small">Pas encore d&apos;avis. Sois le premier !</p>
        )}
      </div>
    </section>
  );
}
