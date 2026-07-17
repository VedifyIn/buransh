import type { OfflineInteraction } from './db';
import { localDb } from './db';

const MAX_RETRIES = 3;
const BATCH_SIZE = 10;
let isProcessing = false;

async function processSingleItem(item: OfflineInteraction): Promise<boolean> {
  try {
    const response = await fetch(`/api/interactions/${item.action_type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: item.slug,
        payload: item.payload,
        createdAt: item.created_at,
      }),
    });

    if (response.ok) {
      return true;
    }

    // Server error - check if we should retry
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

  try {
    const queueItems = await localDb.syncQueue.toArray();
    if (queueItems.length === 0) return;

    // Process in batches to avoid overwhelming the server
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

      // If any item failed, stop processing to avoid hammering the server
      const anyFailed = results.some(
        (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value),
      );

      if (anyFailed && !navigator.onLine) {
        console.log('Network unavailable, stopping sync');
        break;
      }
    }
  } finally {
    isProcessing = false;
  }
}

/**
 * Initialize the sync engine event listeners.
 * Call this once from your app entry point.
 */
export function initializeSyncEngine() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', processSyncQueue);

  window.addEventListener('trigger-sync', () => {
    processSyncQueue().catch(console.error);
  });

  // Process any pending items on initialization
  if (navigator.onLine) {
    processSyncQueue().catch(console.error);
  }
}
