import Dexie, { type Table } from 'dexie';

export interface OfflineInteraction {
  id?: number;
  slug?: string; // post slug (contentId) — optional for non-post actions like preferences
  action_type: 'like' | 'bookmark' | 'comment' | 'rating' | 'clap' | 'preferences';
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

export interface CachedUserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  font_size: number;
  read_mode: number;
  meta: Record<string, unknown>;
}

class BuranshBrowserDB extends Dexie {
  syncQueue!: Table<OfflineInteraction>;
  cachedPosts!: Table<CachedPostState>;
  userPreferences!: Table<CachedUserPreferences>;

  constructor() {
    super('BuranshBrowserDB');

    // Version 2: Original schema with syncQueue and cachedPosts
    this.version(2).stores({
      syncQueue: '++id, slug, action_type',
      cachedPosts: 'slug, last_synced_at',
    });

    // Version 3: Add userPreferences table
    this.version(3).stores({
      syncQueue: '++id, slug, action_type',
      cachedPosts: 'slug, last_synced_at',
      userPreferences: 'userId',
    });
  }
}

export const localDb = typeof window !== 'undefined' ? new BuranshBrowserDB() : null;
