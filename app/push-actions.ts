"use server";

import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

type Subscription = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

// Enregistre l'appareil pour recevoir les notifications.
export async function savePushSubscription(sub: Subscription): Promise<{ ok: boolean }> {
  const me = await getCurrentProfile();
  const endpoint = sub.endpoint ?? "";
  if (!me || !endpoint.startsWith("https://") || !sub.keys?.p256dh || !sub.keys.auth) return { ok: false };
  const supabase = await createClient();
  // Le même téléphone a pu servir à un autre compte : on repart de zéro pour cet appareil.
  await supabase.rpc("forget_push", { old_endpoint: endpoint });
  const { error } = await supabase
    .from("push_subscriptions")
    .insert({ endpoint, user_id: me.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth });
  return { ok: !error };
}

export async function removePushSubscription(endpoint: string) {
  const me = await getCurrentProfile();
  if (!me) return;
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", me.id);
}
