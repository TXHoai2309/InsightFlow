const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

type SupabaseRealtimeClient = {
  channel: (name: string) => {
    on: (...args: unknown[]) => {
      subscribe: (callback?: (status: unknown) => void) => unknown;
    };
  };
  removeChannel: (channel: unknown) => unknown;
};

/**
 * Optional Supabase Realtime client.
 *
 * Main Supabase reads/writes use REST helpers in supabase.ts. Realtime is only
 * an alert-sync enhancement, and alert.store.ts already falls back to polling
 * when this value is null.
 *
 * Keep this file dependency-free so local dev does not fail to compile when
 * @supabase/supabase-js has not been installed in node_modules.
 */
export const supabaseClient: SupabaseRealtimeClient | null = null;

void supabaseUrl;
void supabaseAnonKey;
