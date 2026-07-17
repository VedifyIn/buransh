import Dexie, { type Table } from 'dexie';

export interface OfflineInteraction {
  id?: number;
  slug: string; // post slug (contentId) — client-facing key
  action_type: 'like' | 'bookmark' | 'comment' | 'rating' | 'clap';
  payload: Record<string, unknown>;
  created_at: number;
  retry_count?: number;
}

export interface CachedPostState {
  slug: string;
  comments_state: 'enabled' | 'disabled' | 'auth_only';
  interactions_state: 'enabled' | 'disabled' | 'auth_only';
  highlights_notes: 'enabled' | 'disabled' | 'auth_only';
  last_synced_at: number;
}

class BuranshBrowserDB extends Dexie {
  syncQueue!: Table<OfflineInteraction>;
  cachedPosts!: Table<CachedPostState>;

  constructor() {
    super('BuranshBrowserDB');
    this.version(2).stores({
      syncQueue: '++id, slug, action_type',
      cachedPosts: 'slug, last_synced_at',
    });
  }
}

export const localDb = typeof window !== 'undefined' ? new BuranshBrowserDB() : null;
