export * from './types';
export { MockDB } from './providers/mock/mock';
export { getSupabaseDB } from './providers/supabase/supabase';

import { MockDB } from './providers/mock/mock';
import { getSupabaseDB } from './providers/supabase/supabase';
import type { DatabaseProvider } from './types';

/**
 * Explicit provider selection. Pass the logged-in user's access token
 * when providerName is 'supabase' so writes are authenticated as that
 * user — without it, auth.uid() is null server-side and RLS will
 * reject any write carrying a real user_id. Omit for anonymous requests.
 */
export function getDbAdapter(providerName: string, accessToken?: string): DatabaseProvider {
  switch (providerName?.toLowerCase()) {
    case 'supabase':
      return getSupabaseDB(accessToken);
    case 'mock':
    default:
      return MockDB;
  }
}

/**
 * Auto-selects Supabase when configured, otherwise falls back to
 * MockDB — handy for local dev without a Supabase project wired up.
 */
export function getDB(accessToken?: string): DatabaseProvider {
  const hasSupabaseConfig = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  return hasSupabaseConfig ? getSupabaseDB(accessToken) : MockDB;
}
