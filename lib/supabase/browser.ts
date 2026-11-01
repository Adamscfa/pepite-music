import { createBrowserClient } from "@supabase/ssr";
import { supabaseKey, supabaseUrl } from "./config";

// Client Supabase côté navigateur, pour écouter les nouveautés en direct.
// Il réutilise la session de connexion (cookies) : pas besoin de se reconnecter.
let client: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserClient() {
  if (!supabaseUrl || !supabaseKey) return null;
  client ??= createBrowserClient(supabaseUrl, supabaseKey);
  return client;
}
