import type { DatabaseProvider } from './types';
import { MockDB } from './packages/db-adapters/src/providers/mock/mock';
import { SupabaseDB } from './packages/db-adapters/src/providers/supabase/supabase';

export function getDbAdapter(providerName: string): DatabaseProvider {
  switch (providerName?.toLowerCase()) {
    case 'supabase':
      return SupabaseDB;
    case 'mock':
    default:
      return MockDB;
  }
}

export * from './types';
