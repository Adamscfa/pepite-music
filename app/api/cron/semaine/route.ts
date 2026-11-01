import { createClient } from "@supabase/supabase-js";
import { tally, weekStart } from "@/lib/data";
import { hasPush, wakeUp } from "@/lib/push";
import { supabaseUrl } from "@/lib/supabase/config";

// Rendez-vous de la semaine, lancé automatiquement par Vercel (voir vercel.json) :
// - lundi matin (?quoi=lundi) : la Pépite de la semaine dernière, et le vote qui recommence ;
// - jeudi soir (?quoi=rappel) : un rappel à ceux qui n'ont pas encore voté.
// Il faut dans Vercel : CRON_SECRET (n'importe quel mot de passe long) et SUPABASE_SERVICE_ROLE_KEY.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Non autorisé", { status: 401 });
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return Response.json({ ok: false, reason: "SUPABASE_SERVICE_ROLE_KEY manquant" });

  // Clé « service » : peut lire tous les appareils abonnés. Ne sert qu'ici, côté serveur.
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const what = new URL(request.url).searchParams.get("quoi") === "rappel" ? "rappel" : "lundi";

  let announcement: { title: string; body: string; url: string };
  let excluded = new Set<string>();

  if (what === "lundi") {
    const { data } = await admin.from("weekly_votes").select("*").eq("week", weekStart(1));
    const winner = tally(data ?? [])[0];
    announcement = winner
      ? {
          title: "💎 La Pépite de la semaine",
          body: `« ${winner.album_title} » de ${winner.artist_name} l'emporte avec ${winner.votes} vote${winner.votes > 1 ? "s" : ""}. Le vote de cette semaine est ouvert !`,
          url: `/album/${winner.album_id}`,
        }
      : {
          title: "💎 Nouvelle semaine sur Pépite",
          body: "Le vote pour la Pépite de la semaine est ouvert : choisis ton album depuis sa page.",
          url: "/",
        };
  } else {
    // Ceux qui ont déjà voté cette semaine ne reçoivent pas le rappel.
    const { data } = await admin.from("weekly_votes").select("user_id").eq("week", weekStart());
    excluded = new Set((data ?? []).map((v) => v.user_id as string));
    announcement = {
      title: "💎 Plus que quelques jours pour voter",
      body: "Quel album mérite d'être la Pépite de la semaine ? Vote depuis sa page avant dimanche soir.",
      url: "/explorer",
    };
  }

  // L'annonce est lue par le téléphone au moment de la notification (/api/push/latest).
  const { error } = await admin.from("announcements").insert(announcement);
  if (error) return Response.json({ ok: false, reason: "Fichier SQL 10 pas encore exécuté ?" });
  if (!hasPush) return Response.json({ ok: true, sent: 0, reason: "Clés de notification absentes" });

  const { data: subs } = await admin.from("push_subscriptions").select("endpoint, user_id");
  const endpoints = (subs ?? []).filter((s) => !excluded.has(s.user_id as string)).map((s) => s.endpoint as string);
  const result = await wakeUp(endpoints, (endpoint) => admin.from("push_subscriptions").delete().eq("endpoint", endpoint));
  return Response.json({ ok: true, what, ...result });
}
