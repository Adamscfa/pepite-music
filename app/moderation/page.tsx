import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AuthorLink from "@/components/AuthorLink";
import Cover from "@/components/Cover";
import Stars from "@/components/Stars";
import { getCurrentProfile, type Profile } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { clearErrors, deleteReviewAsAdmin, dismissReports, setReviewHidden } from "./actions";

export const metadata: Metadata = { title: "Modération" };

const REASONS: Record<string, string> = {
  spam: "Spam ou pub",
  mechant: "Message méchant",
  "hors-sujet": "Hors sujet",
  autre: "Autre",
};

type Report = {
  id: number;
  reason: string;
  created_at: string;
  review_id: number;
  reporter: { username: string; display_name: string } | null;
  review: {
    id: number;
    album_title: string;
    track_title: string | null;
    artist_name: string;
    cover_url: string | null;
    rating: number;
    body: string;
    hidden: boolean;
    profile: Profile;
  } | null;
};

type ErrorRow = { id: number; message: string; digest: string | null; path: string | null; created_at: string };

// Page réservée aux administrateurs : avis signalés et erreurs du site.
// Pour devenir administrateur : Supabase > Table Editor > profiles > colonne is_admin = true.
export default async function ModerationPage() {
  const me = await getCurrentProfile();
  if (!me?.is_admin) notFound();
  const supabase = await createClient();
  const [{ data: reports }, { data: errors }] = await Promise.all([
    supabase
      .from("reports")
      .select(
        "*, reporter:profiles!reports_user_id_fkey(username, display_name), review:reviews(*, profile:profiles!reviews_user_id_fkey(*))",
      )
      .order("created_at", { ascending: false })
      .limit(200)
      .returns<Report[]>(),
    supabase.from("errors").select("*").order("created_at", { ascending: false }).limit(50).returns<ErrorRow[]>(),
  ]);

  // Un bloc par avis signalé, avec toutes les raisons données.
  const byReview = new Map<number, Report[]>();
  for (const r of reports ?? []) {
    if (!r.review) continue;
    byReview.set(r.review_id, [...(byReview.get(r.review_id) ?? []), r]);
  }

  return (
    <>
      <div className="eyebrow">Réservé aux administrateurs</div>
      <h1 style={{ fontSize: 30, marginBottom: 16 }}>Modération</h1>

      <section>
        <h2 className="section-title">Avis signalés ({byReview.size})</h2>
        {byReview.size === 0 && <div className="empty">Aucun signalement. Tout va bien !</div>}
        <div className="feed">
          {[...byReview.values()].map((list) => {
            const review = list[0].review!;
            return (
              <article key={review.id} className={review.hidden ? "box mod-card hidden-review" : "box mod-card"}>
                <div className="mod-head">
                  <Cover src={review.cover_url} size="s" />
                  <div>
                    <Link href={`/avis/${review.id}`} className="link-under">
                      <b>{review.track_title ?? review.album_title}</b>
                    </Link>
                    <div className="small">
                      {review.artist_name} · par <AuthorLink user={review.profile} />
                    </div>
                  </div>
                  {review.hidden && <span className="kind">Masqué</span>}
                </div>
                <Stars value={review.rating} />
                {review.body && <p className="mod-body">{review.body}</p>}
                <ul className="mod-reasons">
                  {list.map((r) => (
                    <li key={r.id}>
                      <b>{REASONS[r.reason] ?? r.reason}</b> · {r.reporter?.display_name ?? "?"} · {timeAgo(r.created_at)}
                    </li>
                  ))}
                </ul>
                <div className="row" style={{ justifyContent: "flex-start" }}>
                  <form action={dismissReports}>
                    <input type="hidden" name="review_id" value={review.id} />
                    <button className="btn ghost">Rien à signaler</button>
                  </form>
                  <form action={setReviewHidden}>
                    <input type="hidden" name="review_id" value={review.id} />
                    <input type="hidden" name="hidden" value={review.hidden ? "0" : "1"} />
                    <button className="btn ghost">{review.hidden ? "Réafficher" : "Masquer"}</button>
                  </form>
                  <form action={deleteReviewAsAdmin}>
                    <input type="hidden" name="review_id" value={review.id} />
                    <button className="btn danger-btn">Supprimer l&apos;avis</button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section style={{ marginTop: 34 }}>
        <div className="feed-head">
          <h2 className="section-title" style={{ margin: 0 }}>
            Erreurs du site ({errors?.length ?? 0})
          </h2>
          {Boolean(errors?.length) && (
            <form action={clearErrors}>
              <button className="btn ghost">Tout effacer</button>
            </form>
          )}
        </div>
        {errors?.length ? (
          <ul className="mod-errors">
            {errors.map((e) => (
              <li key={e.id}>
                <code>{e.message}</code>
                <small>
                  {e.path ?? "?"} · {timeAgo(e.created_at)}
                  {e.digest ? ` · réf. ${e.digest}` : ""}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty">Aucune erreur enregistrée.</div>
        )}
        <p className="small">
          Une erreur « [serveur] » donne une référence : cherche-la dans Vercel &gt; Logs pour voir le détail.
        </p>
      </section>
    </>
  );
}
