import type { CachedInteractionState, CachedPostState, CachedUserPreferences } from './db';
import { localDb } from './db';

/**
 * Cache utilities for storing and retrieving data from IndexedDB
 * to support offline functionality
 */

// ============================================================================
// Post State Cache
// ============================================================================

/**
 * Cache post metadata (comments/interactions/highlights states)
 */
export async function cachePostState(
  slug: string,
  state: Omit<CachedPostState, 'slug' | 'last_synced_at'>,
): Promise<void> {
  if (!localDb) return;

  await localDb.cachedPosts.put({
    slug,
    ...state,
    last_synced_at: Date.now(),
  });
}

/**
 * Get cached post state
 */
export async function getCachedPostState(slug: string): Promise<CachedPostState | null> {
  if (!localDb) return null;
  return (await localDb.cachedPosts.get(slug)) ?? null;
}

/**
 * Check if post state is stale (older than 1 hour)
 */
export function isPostStateFresh(cached: CachedPostState | null): boolean {
  if (!cached) return false;
  const ONE_HOUR = 60 * 60 * 1000;
  return Date.now() - cached.last_synced_at < ONE_HOUR;
}

/**
 * Invalidate (delete) cached post state
 */
export async function invalidatePostState(slug: string): Promise<void> {
  if (!localDb) return;
  await localDb.cachedPosts.delete(slug);
}

// ============================================================================
// User Preferences Cache
// ============================================================================

/**
 * Cache user preferences locally
 */
export async function cacheUserPreferences(
  userId: string,
  prefs: Omit<CachedUserPreferences, 'userId'>,
): Promise<void> {
  if (!localDb) return;

  await localDb.userPreferences.put({
    userId,
    ...prefs,
  });
}

/**
 * Get cached user preferences
 */
export async function getCachedUserPreferences(
  userId: string,
): Promise<CachedUserPreferences | null> {
  if (!localDb) return null;
  return (await localDb.userPreferences.get(userId)) ?? null;
}

/**
 * Get preferences with fallback to defaults if not cached
 */
export async function getUserPreferencesWithDefaults(userId: string): Promise<{
  theme: 'light' | 'dark' | 'system';
  font_size: number;
  read_mode: number;
  meta: Record<string, unknown>;
  isCached: boolean;
}> {
  const cached = await getCachedUserPreferences(userId);

  if (cached) {
    return { ...cached, isCached: true };
  }

  // Return defaults if not cached
  return {
    theme: 'system',
    font_size: 3,
    read_mode: 1,
    meta: {},
    isCached: false,
  };
}

/**
 * Clear all cached preferences for a user (e.g., on logout)
 */
export async function clearUserPreferences(userId: string): Promise<void> {
  if (!localDb) return;
  await localDb.userPreferences.delete(userId);
}

// ============================================================================
// Interaction State Cache
// ============================================================================

/**
 * Update cached interaction state after an action
 */
export async function updateCachedInteraction(
  slug: string,
  actorId: string,
  updates: Partial<Omit<CachedInteractionState, 'slug' | 'actorId' | 'last_updated'>>,
): Promise<void> {
  if (!localDb) return;

  const existing = await localDb.interactionStates
    .where('[slug+actorId]')
    .equals([slug, actorId])
    .first();

  const updated: CachedInteractionState = {
    slug,
    actorId,
    isLiked: existing?.isLiked ?? false,
    isBookmarked: existing?.isBookmarked ?? false,
    isRead: existing?.isRead ?? false,
    claps: existing?.claps ?? 0,
    ...updates,
    last_updated: Date.now(),
  };

  await localDb.interactionStates.put(updated);
}

/**
 * Get cached interaction state for a post
 */
export async function getCachedInteraction(
  slug: string,
  actorId: string,
): Promise<CachedInteractionState | null> {
  if (!localDb) return null;

  const cached = await localDb.interactionStates
    .where('[slug+actorId]')
    .equals([slug, actorId])
    .first();

  return cached ?? null;
}

/**
 * Clear all cached interactions for cleanup
 */
export async function clearOldInteractionCache(olderThanDays = 7): Promise<void> {
  if (!localDb) return;

  const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

  await localDb.interactionStates.where('last_updated').below(cutoff).delete();
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Clear all caches (useful for logout or reset)
 */
export async function clearAllCaches(): Promise<void> {
  if (!localDb) return;

  await Promise.all([
    localDb.cachedPosts.clear(),
    localDb.userPreferences.clear(),
    localDb.interactionStates.clear(),
  ]);
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  postsCount: number;
  preferencesCount: number;
  interactionsCount: number;
  syncQueueCount: number;
}> {
  if (!localDb) {
    return { postsCount: 0, preferencesCount: 0, interactionsCount: 0, syncQueueCount: 0 };
  }

  const [postsCount, preferencesCount, interactionsCount, syncQueueCount] = await Promise.all([
    localDb.cachedPosts.count(),
    localDb.userPreferences.count(),
    localDb.interactionStates.count(),
    localDb.syncQueue.count(),
  ]);

  return { postsCount, preferencesCount, interactionsCount, syncQueueCount };
}
