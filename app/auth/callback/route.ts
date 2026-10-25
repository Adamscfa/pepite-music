import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Retour du lien de confirmation par e-mail, ou de Google : on ouvre la session puis on va au fil.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
  }
  // Google renvoie "error" quand la connexion est refusée ou annulée.
  const fromGoogle = searchParams.has("error");
  return NextResponse.redirect(`${origin}/connexion?erreur=${fromGoogle ? "google" : "lien"}`);
}
