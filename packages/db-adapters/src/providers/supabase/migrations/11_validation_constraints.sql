-- ====================================================================
-- 11: VALIDATION CONSTRAINTS & RATE LIMITING
-- Additional database-level validation and constraints to prevent
-- abuse and ensure data integrity.
-- ====================================================================

-- ── Clap Count Limits ───────────────────────────────────────────────

-- Enforce maximum clap count per user/post (prevents abuse)
alter table user_post_interactions
  add constraint check_claps_limit
  check (claps >= 0 and claps <= 50);

-- ── Comment Content Validation ──────────────────────────────────────

-- Ensure comments have meaningful content (already exists but adding explicit check)
-- Length constraint is already in place: check (length(content) <= 3000)
alter table post_comments
  add constraint check_comment_not_empty
  check (trim(content) != '');

-- ── Highlight Content Validation ────────────────────────────────────

-- Already has check_highlight_has_content from migration 05
-- but let's add explicit trimming check for notes
alter table post_highlights
  drop constraint if exists check_highlight_note_not_empty;

alter table post_highlights
  add constraint check_highlight_note_not_empty
  check (
    note is null or trim(note) != ''
  );

-- ── Anonymous Actor Validation ──────────────────────────────────────

-- Ensure anon_id is a valid UUID format when present
alter table user_post_interactions
  add constraint check_anon_id_format
  check (
    anon_id is null or 
    anon_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );

alter table post_highlights
  add constraint check_anon_id_format
  check (
    anon_id is null or 
    anon_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );

-- ── Post ID Validation ──────────────────────────────────────────────

-- Ensure post_id is a valid UUID v5 format
alter table posts
  add constraint check_post_id_format
  check (
    post_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  );

-- ── Slug Validation ─────────────────────────────────────────────────

-- Ensure slugs follow URL-safe format (lowercase, hyphens, alphanumeric)
alter table posts
  add constraint check_slug_format
  check (
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and
    length(slug) >= 1 and
    length(slug) <= 200
  );

-- ── Rating Temporal Consistency ─────────────────────────────────────

-- Ensure bookmarked_at is set when is_bookmarked is true
alter table user_post_interactions
  drop constraint if exists check_bookmarked_at_consistency;

alter table user_post_interactions
  add constraint check_bookmarked_at_consistency
  check (
    (is_bookmarked = true and bookmarked_at is not null) or
    (is_bookmarked = false and bookmarked_at is null)
  );

-- Ensure read_at is set when is_read is true
alter table user_post_interactions
  drop constraint if exists check_read_at_consistency;

alter table user_post_interactions
  add constraint check_read_at_consistency
  check (
    (is_read = true and read_at is not null) or
    (is_read = false and read_at is null)
  );

-- ── Build Validation ────────────────────────────────────────────────

-- Ensure commit_id is not empty
alter table builds
  add constraint check_commit_id_not_empty
  check (trim(commit_id) != '');

-- Ensure version is not empty
alter table builds
  add constraint check_version_not_empty
  check (trim(version) != '');

-- ── Comment Edit Validation ─────────────────────────────────────────

-- Ensure edited_at is set when edit_count > 0
alter table post_comments
  drop constraint if exists check_edited_at_consistency;

alter table post_comments
  add constraint check_edited_at_consistency
  check (
    (edit_count > 0 and edited_at is not null) or
    (edit_count = 0 and edited_at is null)
  );

-- Ensure is_approved comments can be seen (prevents orphaned pinned comments)
alter table post_comments
  add constraint check_pinned_must_be_approved
  check (
    not is_pinned or (is_pinned and is_approved)
  );

-- ── Highlight Selector Validation ──────────────────────────────────

-- If offsets are provided, selectors should also be provided for robustness
alter table post_highlights
  drop constraint if exists check_selector_completeness;

alter table post_highlights
  add constraint check_selector_completeness
  check (
    (start_offset is null and end_offset is null) or
    (start_offset is not null and end_offset is not null and 
     selector_prefix is not null and selector_suffix is not null)
  );
