-- ====================================================================
-- 06: INDEXES & TRIGGERS
-- Performance indexes and automated lifecycle triggers. Separated
-- from table creation so all tables exist before indexes reference them.
-- ====================================================================

-- ── Performance Indexes ─────────────────────────────────────────────

-- Partial index: only indexed rows where is_bookmarked = true.
-- Smaller and faster than a full-table index for bookmark lookups.
create index if not exists idx_user_bookmarks
  on user_post_interactions (user_id, bookmarked_at desc, post_id)
  where is_bookmarked = true;

-- Aggregate index for leaderboard ranking queries:
-- SUM(claps), AVG(rating), COUNT(is_liked) grouped by post_id.
create index if not exists idx_leaderboard_aggregates
  on user_post_interactions (post_id, claps, rating, is_liked);

-- GIN index for querying user preferences by JSONB meta field.
create index if not exists idx_user_preferences_meta
  on user_preferences using gin (meta);

-- Fast comment feed ordering: post → approved → pinned → newest.
create index if not exists idx_comments_feed_ordering
  on post_comments (post_id, is_approved, is_pinned desc, created_at desc);

-- Post lifecycle: quickly find posts by build state for deletion marking.
create index if not exists idx_posts_build_state
  on posts (last_seen_build_id, is_deleted);

-- ── updated_at Helper ───────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to all tables that have the column.
create trigger trg_user_preferences_updated_at
  before update on user_preferences
  for each row execute function set_updated_at();

create trigger trg_user_post_interactions_updated_at
  before update on user_post_interactions
  for each row execute function set_updated_at();

create trigger trg_post_comments_updated_at
  before update on post_comments
  for each row execute function set_updated_at();

create trigger trg_post_highlights_updated_at
  before update on post_highlights
  for each row execute function set_updated_at();

-- ── Comment Triggers ────────────────────────────────────────────────

-- Stamp was_registered_user once at insert time, so it survives
-- later anonymization (ON DELETE SET NULL only touches user_id).
create or replace function stamp_was_registered_user()
returns trigger as $$
begin
  new.was_registered_user := (new.user_id is not null);
  return new;
end;
$$ language plpgsql;

create trigger trg_comment_stamp_registered
  before insert on post_comments
  for each row execute function stamp_was_registered_user();

-- Allow editing a comment's content exactly once.
-- Anonymous comments can never be edited (no verified identity).
create or replace function enforce_comment_edit_limit()
returns trigger as $$
begin
  if new.content is distinct from old.content then
    if old.edit_count >= 1 then
      raise exception 'Comments can only be edited once';
    end if;
    new.edit_count := old.edit_count + 1;
    new.edited_at := timezone('utc'::text, now());
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_comment_edit_limit
  before update on post_comments
  for each row execute function enforce_comment_edit_limit();

-- ── Post Lifecycle Trigger ──────────────────────────────────────────

-- When a new build is inserted, mark posts not seen in that build as
-- deleted. IS DISTINCT FROM handles NULLs correctly (unlike !=).
create or replace function update_posts_deletion_status()
returns trigger as $$
begin
  update posts
  set is_deleted = true
  where last_seen_build_id is distinct from new.id
    and is_deleted = false;
  return new;
end;
$$ language plpgsql;

create or replace trigger trigger_on_new_build
  after insert on builds
  for each row
  execute function update_posts_deletion_status();
