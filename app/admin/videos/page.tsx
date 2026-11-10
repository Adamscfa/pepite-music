import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import VideoReview from "./VideoReview";
import VideoUpload from "./VideoUpload";

export const metadata: Metadata = { title: "Vidéos à valider" };

type VideoRow = {
  id: string;
  status: string;
  format: string;
  storage_path: string | null;
  editorial: { title?: string } | null;
  created_at: string;
};

const STATUS: Record<string, string> = {
  rendering: "En préparation",
  pending: "À valider",
  approved: "Approuvée",
  rejected: "Refusée",
  published: "Publiée",
  failed: "Échec de préparation",
};

export default async function AdminVideosPage() {
  const me = await getCurrentProfile();
  if (!me?.is_admin) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("video_queue")
    .select("id, status, format, storage_path, editorial, created_at")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<VideoRow[]>();

  if (error) {
    return (
      <>
        <div className="eyebrow">Réservé aux administrateurs</div>
        <h1>Vidéos à valider</h1>
        <div className="empty">
          La file vidéo n&apos;est pas accessible. Vérifie que les fichiers
          `14-video-queue.sql` et `15-video-review.sql` ont bien été exécutés dans Supabase.
        </div>
      </>
    );
  }

  const videos = await Promise.all(
    (data ?? []).map(async (video) => {
      if (!video.storage_path) return { ...video, url: null };
      const { data: signed, error: signedError } = await supabase.storage
        .from("weekly-videos")
        .createSignedUrl(video.storage_path, 60 * 60);
      return { ...video, url: signedError ? null : signed.signedUrl };
    }),
  );

  return (
    <div className="admin-videos">
      <div className="eyebrow">Réservé aux administrateurs</div>
      <h1>Vidéos à valider</h1>
      <p className="small">
        Les vidéos envoyées ici restent privées. Elles ne sont pas publiées sur les réseaux.
      </p>
      <VideoUpload userId={me.id} />

      <section>
        <h2 className="section-title">File de vidéos ({videos.length})</h2>
        {videos.length === 0 ? (
          <div className="empty">
            Aucune vidéo pour l&apos;instant. Le SQL crée la file, mais ne génère pas lui-même
            de vidéo. Ajoute un MP4 ci-dessus pour le voir ici et le valider.
            <p className="small">
              <Link className="link-under" href="/studio">Ouvrir le Studio TikTok</Link>
              {" "}pour préparer des visuels. Le générateur hebdomadaire automatique n&apos;est pas encore activé.
            </p>
          </div>
        ) : (
          <div className="feed">
            {videos.map((video) => (
              <article className="box video-card" key={video.id}>
                <div className="video-card-heading">
                  <div>
                    <b>{video.editorial?.title || "Vidéo Pépite"}</b>
                    <div className="small">
                      {STATUS[video.status] ?? video.status} · {video.format} ·{" "}
                      {new Date(video.created_at).toLocaleString("fr-FR")}
                    </div>
                  </div>
                </div>
                {video.url ? (
                  <video controls preload="metadata" src={video.url}>
                    Ton navigateur ne peut pas lire cette vidéo.
                  </video>
                ) : (
                  <p className="small error">Le fichier vidéo est indisponible dans le stockage privé.</p>
                )}
                {video.status === "pending" && <VideoReview id={video.id} />}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
