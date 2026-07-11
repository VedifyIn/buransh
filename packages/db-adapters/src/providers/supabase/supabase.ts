import { createClient } from '@supabase/supabase-js';
import type { DatabaseProvider, CommentNode } from '../../types';

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

  return {
    async saveRating(contentId, score, anonId, userId) {
      const isAnon = !userId;
      const { error } = await supabase.from('user_post_interactions').upsert(
        {
          post_id: contentId,
          user_id: userId || null,
          anon_id: isAnon ? anonId : null, // must be a real UUID, not an IP
          rating: score,
        },
        { onConflict: 'post_id,actor_id' }, // single target, no branching needed
      );
      return { success: !error, error: error?.message };
    },

    async getRatings(contentId) {
      const { data, error } = await supabase
        .from('user_post_interactions')
        .select('rating')
        .eq('post_id', contentId)
        .not('rating', 'is', null);

      if (error || !data || data.length === 0) return { average: 0, count: 0 };
      const count = data.length;
      const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
      return { average: Math.round((sum / count) * 10) / 10, count };
    },

    async submitClap(contentId, count, anonId, userId) {
      const isAnon = !userId;

      // 1. Upsert this actor's own clap count
      const { error: upsertError } = await supabase.from('user_post_interactions').upsert(
        {
          post_id: contentId,
          user_id: userId || null,
          anon_id: isAnon ? anonId : null, // must be a real UUID, not an IP
          claps: count,
        },
        { onConflict: 'post_id,actor_id' },
      );

      if (upsertError) {
        throw new Error(`Failed to save clap: ${upsertError.message}`);
      }

      // 2. Sum claps in the database instead of pulling every row to JS —
      // scales much better on posts with a lot of engagement.
      const { data, error: sumError } = await supabase
        .from('user_post_interactions')
        .select('total:claps.sum()')
        .eq('post_id', contentId)
        .single();

      if (sumError) {
        throw new Error(`Failed to total claps: ${sumError.message}`);
      }

      return { totalClaps: Number(data?.total ?? count) };
    },

    async getComments(contentId) {
      const { data, error } = await supabase
        .from('public_post_comments_view')
        .select('*')
        .eq('post_id', contentId)
        .order('created_at', { ascending: true });

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
      const { data: row, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: contentId,
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
  };
}
