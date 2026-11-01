import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  // Le classement choisi sur la page Classements devient « le tien » pour les tendances
  // (un pays, le monde ou la France), retenu un an.
  const url = request.nextUrl;
  // (Pas pendant le préchargement des liens : seulement quand on ouvre vraiment la page.)
  const prefetch =
    request.headers.has("next-router-prefetch") || /prefetch/i.test(request.headers.get("sec-purpose") ?? request.headers.get("purpose") ?? "");
  if (url.pathname === "/classements" && !prefetch) {
    const zone = url.searchParams.get("zone");
    const id = url.searchParams.get("id");
    const value = zone === "pays" && id && /^\d+$/.test(id) ? id : zone === "monde" || zone === "france" ? zone : null;
    if (value) {
      response.cookies.set("top_pays", value, { path: "/", maxAge: 365 * 24 * 3600, sameSite: "lax" });
    }
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
