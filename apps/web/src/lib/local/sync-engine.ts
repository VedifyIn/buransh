import type { OfflineInteraction } from './db';
import { localDb } from './db';

const MAX_RETRIES = 3;
const BATCH_SIZE = 10;
const DEBOUNCE_TIME = 5 * 60 * 1000; // 5 minutes
const INITIAL_BACKOFF = 30 * 1000; // 30 seconds
const MAX_BACKOFF = 30 * 60 * 1000; // 30 minutes

let isProcessing = false;
let debounceTimer: number | null = null;
let backoffTimer: number | null = null;
let currentBackoff = INITIAL_BACKOFF;
let lastSyncAttempt = 0;

// Import shared API routes configuration
const API_ROUTES: Record<string, string> = {
  like: '/api/likes',
  bookmark: '/api/bookmarks',
  rating: '/api/ratings',
  clap: '/api/claps',
  comment: '/api/comments',
  preferences: '/api/preferences',
};

async function processSingleItem(item: OfflineInteraction): Promise<boolean> {
  try {
    const route = API_ROUTES[item.action_type];
    if (!route) {
      console.error(`Unknown action_type: ${item.action_type}`);
      return true; // Remove from queue
    }

    // Validate that actions requiring slug have it
    const requiresSlug = ['like', 'bookmark', 'rating', 'clap', 'comment'].includes(
      item.action_type,
    );
    if (requiresSlug && !item.slug) {
      console.error(`Action ${item.action_type} requires slug but none provided`);
      return true; // Remove invalid item from queue
    }

    const body: Record<string, unknown> = { ...item.payload };
    if (item.slug) body.slug = item.slug;

    const response = await fetch(route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return true;
    }

    // Check if it's a client error (4xx) that won't succeed on retry
    if (response.status >= 400 && response.status < 500) {
      console.warn(`Client error ${response.status} for item ${item.id}, removing from queue`);
      return true; // Remove items with client errors
    }

    // Server error (5xx) - check if we should retry
    const retryCount = item.retry_count || 0;
    if (retryCount >= MAX_RETRIES) {
      console.error(`Item ${item.id} exceeded max retries, removing from queue`);
      return true; // Remove from queue after max retries
    }

    // Update retry count for next attempt
    if (localDb && item.id) {
      await localDb.syncQueue.update(item.id, {
        retry_count: retryCount + 1,
      });
    }

    return false;
  } catch (error) {
    console.error('Network failure while processing queue item:', error);
    return false;
  }
}

export async function processSyncQueue() {
  if (!localDb || !navigator.onLine || isProcessing) return;

  isProcessing = true;
  lastSyncAttempt = Date.now();

  try {
    const queueItems = await localDb.syncQueue.toArray();
    if (queueItems.length === 0) {
      // Reset backoff on successful empty queue
      currentBackoff = INITIAL_BACKOFF;
      return;
    }

    console.log(`Processing ${queueItems.length} queued items...`);

    // Process in batches to avoid overwhelming the server
    let allSuccessful = true;
    for (let i = 0; i < queueItems.length; i += BATCH_SIZE) {
      const batch = queueItems.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(batch.map((item) => processSingleItem(item)));

      // Delete successfully processed items
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const item = batch[j];

        if (result.status === 'fulfilled' && result.value && item.id) {
          await localDb.syncQueue.delete(item.id);
        }
      }

      // Check if any item failed
      const anyFailed = results.some(
        (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value),
      );

      if (anyFailed) {
        allSuccessful = false;
        if (!navigator.onLine) {
          console.log('Network unavailable, stopping sync');
          break;
        }
      }
    }

    // Update backoff based on success
    if (allSuccessful) {
      currentBackoff = INITIAL_BACKOFF;
      console.log('✓ All queued items synced successfully');
    } else {
      // Exponential backoff with jitter
      currentBackoff = Math.min(currentBackoff * 2, MAX_BACKOFF);
      const jitter = Math.random() * 1000;
      scheduleNextSync(currentBackoff + jitter);
    }
  } catch (error) {
    console.error('Error during sync:', error);
    // Exponential backoff on error
    currentBackoff = Math.min(currentBackoff * 2, MAX_BACKOFF);
    scheduleNextSync(currentBackoff);
  } finally {
    isProcessing = false;
  }
}

/**
 * Schedule the next automatic sync with exponential backoff
 */
function scheduleNextSync(delay: number): void {
  if (backoffTimer !== null) {
    clearTimeout(backoffTimer);
  }

  backoffTimer = window.setTimeout(() => {
    console.log(`Retrying sync after ${Math.round(delay / 1000)}s backoff...`);
    processSyncQueue().catch(console.error);
  }, delay);
}

/**
 * Trigger sync with debouncing when local changes are detected
 */
export function triggerDebouncedSync(): void {
  if (!localDb) return;

  // Clear existing debounce timer
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }

  // Set new debounce timer
  debounceTimer = window.setTimeout(() => {
    console.log('Debounce period elapsed, triggering sync...');
    processSyncQueue().catch(console.error);
  }, DEBOUNCE_TIME);
}

/**
 * Immediately trigger sync (used for pull-to-refresh and user actions)
 */
export function triggerImmediateSync(): void {
  // Clear debounce timer as we're syncing now
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  // Respect rate limiting - don't spam the server
  const timeSinceLastSync = Date.now() - lastSyncAttempt;
  if (timeSinceLastSync < 5000) {
    console.log('Sync rate limited, please wait...');
    return;
  }

  console.log('Triggering immediate sync...');
  processSyncQueue().catch(console.error);
}

/**
 * Setup pull-to-refresh handler
 */
function setupPullToRefresh(): void {
  let startY = 0;
  let currentY = 0;
  let isPulling = false;

  const handleTouchStart = (e: TouchEvent) => {
    // Only trigger if at top of page
    if (window.scrollY === 0) {
      startY = e.touches[0].clientY;
      isPulling = true;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling) return;
    currentY = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!isPulling) return;

    const pullDistance = currentY - startY;
    // Trigger sync if pulled down more than 100px
    if (pullDistance > 100) {
      console.log('Pull-to-refresh detected, syncing...');
      triggerImmediateSync();
    }

    isPulling = false;
    startY = 0;
    currentY = 0;
  };

  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
}

/**
 * Setup visibility change handler to sync when app becomes active
 */
function setupVisibilityHandler(): void {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && navigator.onLine) {
      // App became visible, check for pending items
      if (localDb) {
        localDb.syncQueue.count().then((count) => {
          if (count > 0) {
            console.log(`App resumed with ${count} pending items, syncing...`);
            triggerImmediateSync();
          }
        });
      }
    }
  });
}

/**
 * Watch for database changes and trigger debounced sync
 */
async function setupDatabaseWatcher(): Promise<void> {
  if (!localDb) return;

  // Watch for items being added to the sync queue
  const handleDbChange = () => {
    localDb?.syncQueue.count().then((count) => {
      if (count > 0) {
        console.log(`${count} items in queue, scheduling debounced sync...`);
        triggerDebouncedSync();
      }
    });
  };

  // Poll for changes (Dexie doesn't have built-in change events)
  let lastCount = await localDb.syncQueue.count();
  setInterval(async () => {
    const currentCount = await localDb?.syncQueue.count();
    if (currentCount !== lastCount && currentCount > 0) {
      handleDbChange();
      lastCount = currentCount;
    } else {
      lastCount = currentCount;
    }
  }, 10000); // Check every 10 seconds
}

/**
 * Initialize the sync engine event listeners.
 * Call this once from your app entry point.
 */
export function initializeSyncEngine() {
  if (typeof window === 'undefined') return;

  // Listen for online event
  window.addEventListener('online', () => {
    console.log('Network online, triggering sync...');
    triggerImmediateSync();
  });

  // Listen for custom trigger events
  window.addEventListener('trigger-sync', () => {
    triggerImmediateSync();
  });

  // Setup pull-to-refresh
  setupPullToRefresh();

  // Setup visibility change handler
  setupVisibilityHandler();

  // Setup database watcher for debounced syncing
  setupDatabaseWatcher().catch(console.error);

  // Process any pending items on initialization
  if (navigator.onLine) {
    localDb?.syncQueue.count().then((count) => {
      if (count > 0) {
        console.log(`Initialized with ${count} pending items, syncing...`);
        processSyncQueue().catch(console.error);
      }
    });
  }
}
