import { hasSupabaseConfig } from "@/lib/supabase/config";

// Rappel affiché tant que Supabase n'est pas branché (voir le README).
export default function SetupNotice() {
  if (hasSupabaseConfig) return null;
  return (
    <div className="notice">
      Supabase n&apos;est pas encore branché : la recherche et les pages d&apos;album marchent,
      mais pas les comptes ni les avis. Remplis le fichier <code>.env.local</code> en suivant le
      README, puis relance <code>npm run dev</code>.
    </div>
  );
}
