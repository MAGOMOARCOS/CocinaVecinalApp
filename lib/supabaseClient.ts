// lib/supabaseClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * Cliente Supabase SOLO para navegador (usa NEXT_PUBLIC_*).
 * - No se crea en top-level (evita romper build/CI).
 * - Si faltan env vars, devuelve null (no revienta CI).
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  _client = createClient(supabaseUrl, supabaseAnonKey);
  return _client;
}
