import { sha1 } from './utils';
import type { SupabaseClient } from '@supabase/supabase-js';

export const DNS_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Generate a deterministic UUID v5 from a namespace and name.
 * Used to create stable post IDs from slugs.
 * @throws {Error} if namespace is not a valid UUID format
 */
export function uuid5(namespace: string, name: string): string {
  // Validate namespace format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(namespace)) {
    throw new Error(`Invalid UUID namespace format: ${namespace}`);
  }

  const nsBytes = hexToBytes(namespace.replace(/-/g, ''));
  const nameBytes = new TextEncoder().encode(name);
  const hash = sha1([...nsBytes, ...nameBytes]);
  const hex = bytesToHex(hash);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    ((parseInt(hex[12], 16) & 0x3) | 0x5).toString(16) + hex.slice(13, 14),
    ((parseInt(hex[14], 16) & 0x3) | 0x8).toString(16) + hex.slice(15, 16),
    hex.slice(16, 32),
  ].join('-');
}

function hexToBytes(hex: string): number[] {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}

function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

type InteractionState = 'enabled' | 'disabled' | 'auth_only';

export interface BuildPostInput {
  slug: string;
  title: string;
  comments_state?: InteractionState;
  interactions_state?: InteractionState;
  highlights_notes?: InteractionState;
}

export interface RenameEntry {
  from: string;
  to: string;
}

export interface BuildRecord {
  id: string;
  commit_id: string;
  version: string;
  build_date: string;
}

/**
 * Service for syncing post lifecycle during static site builds.
 * Handles post creation, updates, renames, and soft-deletion marking.
 */
export class BuildTimeSyncService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Register a new build in the database.
   * This triggers the lifecycle trigger that marks unseen posts as deleted.
   */
  async registerBuild(commitId: string, version: string): Promise<BuildRecord> {
    const { data, error } = await this.supabase
      .from('builds')
      .insert({
        commit_id: commitId,
        version: version,
      })
      .select('id, commit_id, version, build_date')
      .single();

    if (error) {
      throw new Error(`Failed to register build: ${error.message}`);
    }

    return {
      id: String(data.id),
      commit_id: data.commit_id,
      version: data.version,
      build_date: data.build_date,
    };
  }

  /**
   * Sync all posts for the current build.
   * - Creates new posts
   * - Updates existing posts with new metadata
   * - Handles slug renames by preserving the original post_id
   * - Posts not in contentPosts will be marked as deleted by the DB trigger
   */
  async syncPostLifecycle(params: {
    currentBuildId: string;
    contentPosts: BuildPostInput[];
    renames: RenameEntry[];
  }): Promise<{ synced: number; renamed: number }> {
    const { currentBuildId, contentPosts, renames } = params;

    let renamedCount = 0;

    for (const post of contentPosts) {
      const renameEntry = renames.find((r) => r.to === post.slug);

      if (renameEntry) {
        // Preserve the original post_id when renaming
        const oldPostId = uuid5(DNS_NAMESPACE, renameEntry.from);
        renamedCount++;

        await this.upsertPost({
          slug: post.slug,
          post_id: oldPostId,
          title: post.title,
          comments_state: post.comments_state || 'enabled',
          interactions_state: post.interactions_state || 'enabled',
          highlights_notes: post.highlights_notes || 'enabled',
          last_seen_build_id: currentBuildId,
        });
      } else {
        // New post or unchanged slug
        const postId = uuid5(DNS_NAMESPACE, post.slug);

        await this.upsertPost({
          slug: post.slug,
          post_id: postId,
          title: post.title,
          comments_state: post.comments_state || 'enabled',
          interactions_state: post.interactions_state || 'enabled',
          highlights_notes: post.highlights_notes || 'enabled',
          last_seen_build_id: currentBuildId,
        });
      }
    }

    // Posts missing from contentPosts are marked as deleted by trigger_on_new_build
    return { synced: contentPosts.length, renamed: renamedCount };
  }

  /**
   * Upsert a post record. Creates if new, updates if exists.
   * On conflict (post_id already exists), updates slug, title, states,
   * and marks is_deleted = false in case it was soft-deleted before.
   */
  private async upsertPost(data: {
    slug: string;
    post_id: string;
    title: string;
    comments_state: InteractionState;
    interactions_state: InteractionState;
    highlights_notes: InteractionState;
    last_seen_build_id: string;
  }): Promise<void> {
    const { error } = await this.supabase.from('posts').upsert(
      {
        slug: data.slug,
        post_id: data.post_id,
        title: data.title,
        comments_state: data.comments_state,
        interactions_state: data.interactions_state,
        highlights_notes: data.highlights_notes,
        last_seen_build_id: data.last_seen_build_id,
        is_deleted: false,
      },
      { onConflict: 'post_id' },
    );

    if (error) {
      throw new Error(`Failed to upsert post ${data.slug}: ${error.message}`);
    }
  }

  /**
   * Get all posts that were marked as deleted in a specific build.
   * Useful for cleanup tasks or analytics.
   */
  async getDeletedPosts(
    buildId: string,
  ): Promise<Array<{ slug: string; post_id: string; title: string }>> {
    const { data, error } = await this.supabase
      .from('posts')
      .select('slug, post_id, title')
      .eq('is_deleted', true)
      .neq('last_seen_build_id', buildId);

    if (error) {
      throw new Error(`Failed to get deleted posts: ${error.message}`);
    }

    return data || [];
  }
}
