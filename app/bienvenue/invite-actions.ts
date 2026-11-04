"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { after } from "next/server";
import { getCurrentProfile } from "@/lib/data";
import { pushTo } from "@/lib/push";
import { createClient } from "@/lib/supabase/server";

// Accepte l'invitation retenue par le lien /invite/<pseudo> (fichier SQL 11).
export async function claimInvite(): Promise<{ inviter?: string }> {
  const store = await cookies();
  const username = store.get("pepite_invite")?.value;
  if (!username) return {};
  const me = await getCurrentProfile();
  if (!me) return {};
  store.delete("pepite_invite");
  const supabase = await createClient();
  const { data: accepted } = await supabase.rpc("accept_invite", { inviter_username: decodeURIComponent(username) });
  if (accepted !== true) return {};
  const { data: referral } = await supabase
    .from("referrals")
    .select("inviter:profiles!referrals_inviter_id_fkey(id, display_name)")
    .eq("invited_id", me.id)
    .maybeSingle();
  const inviter = referral?.inviter as { id: string; display_name: string } | null | undefined;
  if (inviter) after(() => pushTo(supabase, [inviter.id]).catch(() => {}));
  revalidatePath("/", "layout");
  return { inviter: inviter?.display_name };
}
