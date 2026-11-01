import { hasSupabaseConfig } from "@/lib/supabase/config";

// Rappel affiché tant que Supabase n'est pas branché (voir le README).
export default function SetupNotice() {
  if (hasSupabaseConfig) return null;

  // Sur Vercel, les clés se règlent dans le projet, pas dans un fichier.
  const vercel = process.env.VERCEL_ENV;
  if (vercel) {
    return (
      <div className="notice">
        Supabase n&apos;est pas branché sur cette version du site : la recherche et les pages d&apos;album marchent,
        mais pas les comptes ni les avis.{" "}
        {vercel === "preview"
          ? "C'est une prévisualisation : dans Vercel > Settings > Environment Variables, coche aussi « Preview » pour les deux clés Supabase, puis redéploie."
          : "Dans Vercel > Settings > Environment Variables, ajoute les deux clés Supabase (voir le README), puis redéploie."}
      </div>
    );
  }

  return (
    <div className="notice">
      Supabase n&apos;est pas encore branché : la recherche et les pages d&apos;album marchent,
      mais pas les comptes ni les avis. Remplis le fichier <code>.env.local</code> en suivant le
      README, puis relance <code>npm run dev</code>.
    </div>
  );
}
