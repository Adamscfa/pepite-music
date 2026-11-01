import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseKey, supabaseUrl } from "./config";

// Client Supabase côté navigateur, pour écouter les nouveautés en direct.
// Il réutilise la session de connexion (cookies) : pas besoin de se reconnecter.
// Supabase garde lui-même un seul client par onglet.
export function getBrowserClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseKey) return null;
  return createBrowserClient(supabaseUrl, supabaseKey);
}
