import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Retour du lien de confirmation par e-mail, ou de Google : on ouvre la session puis on va au fil
// (ou au premier pas pour un nouveau membre).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Nouveau membre (premier pas pas encore fait) : on l'accueille sur /bienvenue.
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();
      return NextResponse.redirect(`${origin}${profile?.onboarded === false ? "/bienvenue" : "/"}`);
    }
  }
  // Google renvoie "error" quand la connexion est refusée ou annulée.
  const fromGoogle = searchParams.has("error");
  return NextResponse.redirect(`${origin}/connexion?erreur=${fromGoogle ? "google" : "lien"}`);
}
