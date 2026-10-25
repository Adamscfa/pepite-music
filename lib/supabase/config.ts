export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

// Faux tant que le fichier .env.local n'est pas rempli.
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);
