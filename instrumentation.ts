import type { Instrumentation } from "next";

// Erreurs côté serveur (une page qui plante pendant sa construction) :
// on les note dans la table « errors », visible sur la page Modération.
export const onRequestError: Instrumentation.onRequestError = async (error, request) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return;
  const err = error as Error & { digest?: string };
  try {
    await fetch(`${url}/rest/v1/errors`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        message: `[serveur] ${err?.message ?? String(error)}`.slice(0, 1000),
        digest: err?.digest?.slice(0, 100) ?? null,
        path: request.path.slice(0, 300),
      }),
    });
  } catch {
    // On n'insiste pas.
  }
};
