import { createClient } from '@supabase/supabase-js';
import type {
  DatabaseProvider,
  CommentNode,
  Highlight,
  PostStats,
  PostMetadata,
} from '../../types';
import {
  canPerformOperation,
  validateHighlightOffsets,
  validateClapCount,
  validateRating,
  validateCommentContent,
  validateHighlightContent,
} from '../../utils';

/**
 * Convert a Postgres bigint row ID to string safely.
 * Note: JavaScript numbers lose precision above Number.MAX_SAFE_INTEGER (2^53).
 * Supabase returns bigints as strings by default, so we use String() for safety.
 */
function rowToHighlight(row: Record<string, unknown>): Highlight {
  return {
    id: String(row.id),
    postId: row.post_id as string,
    userId: row.user_id as string | undefined,
    anonId: row.anon_id as string | undefined,
    highlightedText: row.highlighted_text as string | undefined,
    note: row.note as string | undefined,
    selectorPrefix: row.selector_prefix as string | undefined,
    selectorSuffix: row.selector_suffix as string | undefined,
    startOffset: row.start_offset as number | undefined,
    endOffset: row.end_offset as number | undefined,
    color: (row.color as string) || 'yellow',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * IMPORTANT: this factory takes an optional user access token so that
 * logged-in writes are actually authenticated as that user (auth.uid()
 * resolves correctly for RLS). Call it per-request in your Astro API
 * route, passing the token from the user's session cookie, e.g.:
 *
 *   const db = getSupabaseDB(Astro.cookies.get('sb-access-token')?.value);
 *
 * With no token, the client behaves as anonymous — fine for anon
 * ratings/claps/comments, but any write carrying a non-null user_id
 * will be rejected by RLS.
 */
export function getSupabaseDB(accessToken?: string): DatabaseProvider {
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_ANON_KEY || '',
    accessToken ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } } : undefined,
  );

  async function resolvePostId(slug: string): Promise<string | null> {
    const { data } = await supabase.from('posts').select('post_id').eq('slug', slug).maybeSingle();
    return data?.post_id ?? null;
  }

  async function getPostMetadata(slug: string): Promise<PostMetadata | null> {
    const { data } = await supabase
      .from('posts')
      .select(
        'post_id, slug, title, comments_state, interactions_state, highlights_notes, is_deleted',
      )
      .eq('slug', slug)
      .maybeSingle();

    if (!data) return null;

    return {
      postId: data.post_id,
      slug: data.slug,
      title: data.title,
      commentsState: data.comments_state as 'enabled' | 'disabled' | 'auth_only',
      interactionsState: data.interactions_state as 'enabled' | 'disabled' | 'auth_only',
      highlightsNotes: data.highlights_notes as 'enabled' | 'disabled' | 'auth_only',
      isDeleted: data.is_deleted,
    };
  }

  async function getBuildDate(buildId: string): Promise<string | null> {
    const { data } = await supabase
      .from('builds')
      .select('build_date')
      .eq('id', buildId)
      .maybeSingle();
    return data?.build_date ?? null;
  }

  return {
    async getPostMetadata(contentId) {
      return getPostMetadata(contentId);
    },

    async saveRating(contentId, score, anonId, userId) {
      const validationError = validateRating(score);
      if (validationError) {
        return { success: false, error: validationError };
      }

      const post = await getPostMetadata(contentId);
      const check = canPerformOperation(post, 'interaction', userId);
      if (!check.allowed) {
        return { success: false, error: check.error };
      }

      const postId = post!.postId;
      const isAnon = !userId;
      const { error } = await supabase.from('user_post_interactions').upsert(
        {
          post_id: postId,
          user_id: userId || null,
          anon_id: isAnon ? anonId : null,
          rating: score,
        },
        { onConflict: 'post_id,actor_id' },
      );
      return { success: !error, error: error?.message };
    },

    async getRatings(contentId, sinceBuildId) {
      const postId = await resolvePostId(contentId);
      if (!postId) return { average: 0, count: 0 };

      let query = supabase
        .from('user_post_interactions')
        .select('rating')
        .eq('post_id', postId)
        .not('rating', 'is', null);

      if (sinceBuildId) {
        const buildDate = await getBuildDate(sinceBuildId);
        if (buildDate) query = query.gt('updated_at', buildDate);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) return { average: 0, count: 0 };
      const count = data.length;
      const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
      return { average: Math.round((sum / count) * 10) / 10, count };
    },

    async submitClap(contentId, count, anonId, userId) {
      const validationError = validateClapCount(count);
      if (validationError) {
        throw new Error(validationError);
      }

      const post = await getPostMetadata(contentId);
      const check = canPerformOperation(post, 'interaction', userId);
      if (!check.allowed) {
        throw new Error(check.error);
      }

      const postId = post!.postId;
      const isAnon = !userId;

      // Use RETURNING to get total in single round-trip
      const { error: upsertError } = await supabase.from('user_post_interactions').upsert(
        {
          post_id: postId,
          user_id: userId || null,
          anon_id: isAnon ? anonId : null,
          claps: count,
        },
        { onConflict: 'post_id,actor_id' },
      );

      if (upsertError) {
        throw new Error(`Failed to save clap: ${upsertError.message}`);
      }

      // Get total - use aggregate function
      const { data: sumData, error: sumError } = await supabase
        .from('user_post_interactions')
        .select('claps')
        .eq('post_id', postId);

      if (sumError) {
        throw new Error(`Failed to total claps: ${sumError.message}`);
      }

      const totalClaps = sumData?.reduce((sum, row) => sum + (row.claps || 0), 0) ?? count;
      return { totalClaps };
    },

    async getComments(contentId, sinceBuildId) {
      const postId = await resolvePostId(contentId);
      if (!postId) return [];

      let query = supabase
        .from('public_post_comments_view')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (sinceBuildId) {
        const buildDate = await getBuildDate(sinceBuildId);
        if (buildDate) query = query.gt('created_at', buildDate);
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data.map((row): CommentNode => ({
        id: String(row.id),
        contentId: row.post_id,
        parentId: row.parent_comment_id ? String(row.parent_comment_id) : null,
        userName: row.display_author,
        userAvatar: undefined,
        commentText: row.content,
        createdAt: row.created_at,
      }));
    },

    async postComment(contentId, data, userId) {
      const validationError = validateCommentContent(data.commentText);
      if (validationError) {
        throw new Error(validationError);
      }

      const post = await getPostMetadata(contentId);
      const check = canPerformOperation(post, 'comment', userId);
      if (!check.allowed) {
        throw new Error(check.error);
      }

      const postId = post!.postId;
      const { data: row, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          parent_comment_id: data.parentId ? Number(data.parentId) : null,
          user_id: userId || null,
          anon_name: userId ? null : data.userName,
          content: data.commentText,
        })
        .select('*')
        .single();

      if (error || !row) throw new Error(error?.message || 'Failed to post comment');
      return {
        id: String(row.id),
        contentId: row.post_id,
        parentId: row.parent_comment_id ? String(row.parent_comment_id) : null,
        userName: data.userName,
        commentText: row.content,
        createdAt: row.created_at,
      };
    },

    async toggleBookmark(contentId, anonId, userId) {
      const post = await getPostMetadata(contentId);
      const check = canPerformOperation(post, 'interaction', userId);
      if (!check.allowed) {
        return { success: false, isBookmarked: false, error: check.error };
      }

      const postId = post!.postId;

      // Use atomic database function to prevent race conditions
      const { data, error } = await supabase.rpc('toggle_bookmark', {
        p_post_id: postId,
        p_user_id: userId || null,
        p_anon_id: userId ? null : anonId,
      });

      if (error) {
        return { success: false, isBookmarked: false, error: error.message };
      }

      return { success: true, isBookmarked: data as boolean };
    },

    async toggleLike(contentId, anonId, userId) {
      const post = await getPostMetadata(contentId);
      const check = canPerformOperation(post, 'interaction', userId);
      if (!check.allowed) {
        return { success: false, isLiked: false, error: check.error };
      }

      const postId = post!.postId;

      // Use atomic database function to prevent race conditions
      const { data, error } = await supabase.rpc('toggle_like', {
        p_post_id: postId,
        p_user_id: userId || null,
        p_anon_id: userId ? null : anonId,
      });

      if (error) {
        return { success: false, isLiked: false, error: error.message };
      }

      return { success: true, isLiked: data as boolean };
    },

    async markAsRead(contentId, anonId, userId) {
      const post = await getPostMetadata(contentId);
      const check = canPerformOperation(post, 'interaction', userId);
      if (!check.allowed) {
        return { success: false, error: check.error };
      }

      const postId = post!.postId;
      const isAnon = !userId;
      const { error } = await supabase.from('user_post_interactions').upsert(
        {
          post_id: postId,
          user_id: userId || null,
          anon_id: isAnon ? anonId : null,
          is_read: true,
          read_at: new Date().toISOString(),
        },
        { onConflict: 'post_id,actor_id' },
      );
      return { success: !error, error: error?.message };
    },

    async saveHighlight(input) {
      const offsetError = validateHighlightOffsets(input.startOffset, input.endOffset);
      if (offsetError) {
        return { success: false, error: offsetError };
      }

      const contentError = validateHighlightContent(input.highlightedText, input.note);
      if (contentError) {
        return { success: false, error: contentError };
      }

      const post = await getPostMetadata(input.postId);
      const check = canPerformOperation(post, 'highlight', input.userId);
      if (!check.allowed) {
        return { success: false, error: check.error };
      }

      const postId = post!.postId;
      const isAnon = !input.userId;
      const { data: existing } = await supabase
        .from('post_highlights')
        .select('*')
        .eq('post_id', postId)
        .eq('start_offset', input.startOffset ?? null)
        .eq('end_offset', input.endOffset ?? null)
        .eq(isAnon ? 'anon_id' : 'user_id', isAnon ? input.anonId : input.userId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('post_highlights')
          .update({ note: input.note, color: input.color || existing.color })
          .eq('id', existing.id)
          .select('*')
          .single();
        if (error) return { success: false, error: error.message };
        return { success: true, highlight: rowToHighlight(data) };
      }

      const { data, error } = await supabase
        .from('post_highlights')
        .insert({
          post_id: postId,
          user_id: input.userId || null,
          anon_id: isAnon ? input.anonId : null,
          highlighted_text: input.highlightedText,
          note: input.note,
          selector_prefix: input.selectorPrefix,
          selector_suffix: input.selectorSuffix,
          start_offset: input.startOffset,
          end_offset: input.endOffset,
          color: input.color || 'yellow',
        })
        .select('*')
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, highlight: rowToHighlight(data) };
    },

    async getHighlights(contentId, anonId, userId, sinceBuildId) {
      const postId = await resolvePostId(contentId);
      if (!postId) return [];

      const isAnon = !userId;
      let query = supabase
        .from('post_highlights')
        .select('*')
        .eq('post_id', postId)
        .eq(isAnon ? 'anon_id' : 'user_id', isAnon ? anonId : userId)
        .order('created_at', { ascending: true });

      if (sinceBuildId) {
        const buildDate = await getBuildDate(sinceBuildId);
        if (buildDate) query = query.gt('updated_at', buildDate);
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data.map(rowToHighlight);
    },

    async getPostStats(contentId) {
      const postId = await resolvePostId(contentId);
      if (!postId) return { totalLikes: 0, totalClaps: 0, avgRating: 0, ratingCount: 0 };

      const { data, error } = await supabase
        .from('public_post_stats_view')
        .select('*')
        .eq('post_id', postId)
        .maybeSingle();

      if (error || !data) return { totalLikes: 0, totalClaps: 0, avgRating: 0, ratingCount: 0 };
      return {
        totalLikes: Number(data.total_likes),
        totalClaps: Number(data.total_claps),
        avgRating: Number(data.avg_rating),
        ratingCount: Number(data.rating_count),
      };
    },
  };
}
