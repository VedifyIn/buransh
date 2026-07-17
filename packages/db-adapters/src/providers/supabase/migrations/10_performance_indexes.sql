-- ====================================================================
-- 10: ADDITIONAL PERFORMANCE INDEXES
-- Composite indexes for incremental sync queries and improved
-- query performance based on common access patterns.
-- ====================================================================

-- ── Incremental Sync Indexes ────────────────────────────────────────

-- Composite index for incremental interaction syncs filtered by post and updated_at.
-- Supports queries like: WHERE post_id = ? AND updated_at > ?
create index if not exists idx_interactions_post_updated
  on user_post_interactions (post_id, updated_at);

-- Composite index for incremental comment syncs.
-- Supports queries like: WHERE post_id = ? AND created_at > ?
create index if not exists idx_comments_post_created
  on post_comments (post_id, created_at);

-- Composite index for incremental highlight syncs.
-- Supports queries like: WHERE post_id = ? AND updated_at > ?
create index if not exists idx_highlights_post_updated
  on post_highlights (post_id, updated_at);

-- ── Actor-Specific Lookup Indexes ──────────────────────────────────

-- Fast lookup for a specific actor's interaction with a post.
-- Supports queries like: WHERE post_id = ? AND actor_id = ?
-- Note: This complements the unique index uq_interaction_actor which
-- covers (post_id, actor_id) but this one is ordered differently for
-- different query patterns.
create index if not exists idx_interactions_actor_lookup
  on user_post_interactions (actor_id, post_id)
  where actor_id is not null;

-- ── Post Metadata Lookup ────────────────────────────────────────────

-- Index for fast post metadata lookup by slug (already covered by primary key)
-- but adding covering index for common queries that need interaction states.
create index if not exists idx_posts_slug_states
  on posts (slug, comments_state, interactions_state, highlights_notes, is_deleted)
  where is_deleted = false;

-- ── Comment Threading ───────────────────────────────────────────────

-- Improved index for comment threading queries that need to traverse
-- the reply tree for a specific post.
create index if not exists idx_comments_threading
  on post_comments (post_id, parent_comment_id, created_at)
  where is_approved = true;

-- ── Aggregate Query Optimization ────────────────────────────────────

-- Covering index for post stats aggregation queries.
-- Includes all columns needed for the public_post_stats_view.
create index if not exists idx_interactions_stats_covering
  on user_post_interactions (post_id, is_liked, claps, rating)
  where is_liked = true or claps > 0 or rating is not null;

-- ── Build Lifecycle Queries ─────────────────────────────────────────

-- Index for finding posts that need deletion marking when a new build arrives.
-- Supports: WHERE last_seen_build_id != ? AND is_deleted = false
create index if not exists idx_posts_lifecycle_check
  on posts (is_deleted, last_seen_build_id)
  where is_deleted = false;

-- Index for build lookup by commit_id (useful for debugging and rollbacks).
create index if not exists idx_builds_commit
  on builds (commit_id, build_date desc);
