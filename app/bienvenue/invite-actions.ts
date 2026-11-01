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
  const { data: inviter } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("username", decodeURIComponent(username).toLowerCase())
    .maybeSingle();
  if (inviter) after(() => pushTo(supabase, [inviter.id as string]).catch(() => {}));
  revalidatePath("/", "layout");
  return { inviter: (inviter?.display_name as string | undefined) ?? undefined };
}
