import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!process.env.SUPABASE_URL) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(process.env.SUPABASE_URL, key);
  }

  return supabaseClient;
}

/**
 * Server-only helper to look up the latest build record.
 * Used by the delta-fetch layer to know which build the client last saw.
 */
export async function getActiveBuildCutoff(): Promise<{ buildId: string; timestamp: Date }> {
  const supabase = getSupabaseClient();

  const { data } = await supabase
    .from('builds')
    .select('id, build_date')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return {
      buildId: '00000000-0000-0000-0000-000000000000',
      timestamp: new Date(0),
    };
  }

  return {
    buildId: String(data.id),
    timestamp: new Date(data.build_date),
  };
}
