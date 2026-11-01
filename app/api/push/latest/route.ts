import { getCurrentProfile, getNotifications } from "@/lib/data";
import { describe } from "@/lib/notification-text";
import { createClient } from "@/lib/supabase/server";

// Appelé par l'appli (public/sw.js) quand le téléphone reçoit un « réveil » :
// renvoie le texte de la dernière nouveauté non lue (notification ou message).
export async function GET() {
  const me = await getCurrentProfile();
  const fallback = { title: "Pépite", body: "Du nouveau t'attend sur Pépite.", url: "/" };
  if (!me) return Response.json(fallback);

  const supabase = await createClient();
  const [notifications, { data: messages }, { data: news }] = await Promise.all([
    getNotifications(me.id),
    supabase
      .from("messages")
      .select("*, sender:profiles!messages_sender_id_fkey(username, display_name)")
      .eq("recipient_id", me.id)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(1),
    // Annonce de la semaine (envoyée le lundi et le jeudi), si elle est toute récente.
    supabase
      .from("announcements")
      .select("*")
      .gt("created_at", new Date(Date.now() - 3 * 3600 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1),
  ]);
  const announcement = news?.[0] as { id: number; title: string; body: string; url: string; created_at: string } | undefined;
  const notif = notifications.find((n) => !n.read_at);
  const message = messages?.[0] as
    | { body: string; album_title: string | null; created_at: string; sender: { username: string; display_name: string } }
    | undefined;

  const newest = [message?.created_at, notif?.created_at].filter(Boolean).sort().at(-1) ?? "";
  if (announcement && announcement.created_at >= newest) {
    return Response.json({ title: announcement.title, body: announcement.body, url: announcement.url, tag: `annonce-${announcement.id}` });
  }

  if (message && (!notif || message.created_at >= notif.created_at)) {
    return Response.json({
      title: message.sender.display_name,
      body: message.album_title ? `💿 t'a recommandé ${message.album_title}` : message.body.slice(0, 140),
      url: `/messages/${message.sender.username}`,
      tag: `msg-${message.sender.username}`,
    });
  }
  if (notif) {
    const { text, href } = describe(notif);
    return Response.json({ title: "Pépite", body: `${notif.actor.display_name} ${text}`, url: href, tag: `notif-${notif.id}` });
  }
  return Response.json(fallback);
}
