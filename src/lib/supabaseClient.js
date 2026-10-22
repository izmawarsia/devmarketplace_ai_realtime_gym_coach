import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function missingConfigMessage() {
  return (
    'Supabase credentials are missing. Please set VITE_SUPABASE_URL and ' +
    'VITE_SUPABASE_ANON_KEY in your environment (e.g. the workspace Secrets panel).'
  );
}

if (!supabaseUrl || !supabaseAnonKey) {
  // Defer the thrown error until the client is used so the app can render a
  // friendly configuration screen instead of crashing during module load.
  console.error(missingConfigMessage());
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export function getConfigError() {
  return supabase ? null : missingConfigMessage();
}

export function getAppOrigin() {
  return import.meta.env.VITE_APP_URL || window.location.origin;
}
