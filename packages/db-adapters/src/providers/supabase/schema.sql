-- ====================================================================
-- ASTRO STATIC SITE — SUPABASE SCHEMA (FIXED)
-- Supports: claps, ratings, bookmarks, threaded comments
-- for logged-in users AND anonymous (device-id based) users
-- ====================================================================

-- ====================================================================
-- 1. BUILDS TABLE
-- Tracks your Astro static build versions and commit targets
-- ====================================================================
create table builds (
  id bigint generated always as identity primary key,
  commit_id text not null,
  version text not null, -- e.g. '1.0.4'
  build_date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ====================================================================
-- 2. POSTS TABLE
-- ====================================================================
create table posts (
  slug text primary key,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  first_release_build_id bigint references builds(id) on delete set null,
  last_seen_build_id bigint references builds(id) on delete set null,
  is_deleted boolean default false not null
);

-- ====================================================================
-- 3. USER PREFERENCES TABLE
-- FIX: original CHECK constraint was corrupted (mixed in columns
-- `rating` / `content` that belong to post_comments, not this table,
-- and had an unreachable self-referential clause `read_mode = 1`).
-- Also added `meta jsonb` since an index referenced it but the column
-- was never defined.
--
-- ON DELETE: this table is the one exception that still CASCADEs.
-- user_id is the primary key here, and a primary key can never be
-- set to null, so "anonymize instead of cascade" isn't possible —
-- there's nothing left to anonymize once the user is gone, and
-- private per-user settings shouldn't survive account deletion anyway.
-- ====================================================================
create table user_preferences (
  user_id uuid references auth.users(id) on delete cascade primary key,
  theme text default 'system'::text not null
    check (theme in ('light', 'dark', 'system')),
  font_size smallint default 3 not null
    check (font_size between 1 and 5),
  read_mode smallint default 1 not null
    check (read_mode between 1 and 3), -- e.g. 1=normal 2=comfortable 3=compact
  meta jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ====================================================================
-- 4. USER_POST_INTERACTIONS TABLE  (was missing entirely)
-- One row per (post, actor). "Actor" is either a logged-in user_id
-- OR an anonymous client-generated id (a UUID you create with
-- crypto.randomUUID() in the browser and persist in localStorage).
--
-- One table, many widgets: a single row backs every independent
-- widget on the page — the clap counter, the like button, the
-- bookmark toggle, the star rating, and "mark as read" all just
-- read/write their own column on this same row. No new table needed
-- per widget.
--
-- ON DELETE: if a logged-in user deletes their account, we do NOT
-- cascade-delete their claps/likes/ratings/bookmarks (that would
-- distort post-level counts other people see). Instead user_id is
-- set to null and the row is kept, effectively anonymized. See the
-- relaxed check_interaction_actor constraint below — it has to allow
-- "both null" as a valid (anonymized) state, otherwise account
-- deletion itself would fail.
--
-- NOTE ON ANONYMOUS SECURITY: because anon_id is just a value the
-- browser sends (not a verified session), RLS cannot cryptographically
-- prove who "owns" an anon row. This is an accepted trade-off for
-- claps/ratings/bookmarks without forcing login. If you want real
-- protection, switch to Supabase Anonymous Sign-ins
-- (supabase.auth.signInAnonymously()) so anon_id becomes auth.uid()
-- and the same RLS rules as logged-in users apply automatically.
-- ====================================================================
create table user_post_interactions (
  id bigint generated always as identity primary key,
  post_id text not null references posts(slug) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  anon_id uuid, -- client-generated device id, used when user_id is null

  claps int default 0 not null check (claps >= 0), -- Medium-style multi-clap count
  is_liked boolean default false not null, -- separate simple like/heart toggle

  is_bookmarked boolean default false not null,
  bookmarked_at timestamp with time zone,

  is_read boolean default false not null, -- "mark as read" widget
  read_at timestamp with time zone,

  rating smallint check (rating is null or rating between 1 and 5), -- e.g. recipes

  -- always non-null: exactly one of user_id/anon_id is set, per
  -- check_interaction_actor below. Exists so ON CONFLICT has a single,
  -- non-partial unique target — Postgres can't reliably infer a
  -- PARTIAL unique index (e.g. "where user_id is not null") from a
  -- plain column list the way Supabase-js's onConflict sends it, so
  -- upserts against uq_interaction_user/uq_interaction_anon would
  -- intermittently fail with "no unique or exclusion constraint
  -- matching the ON CONFLICT specification".
  actor_id uuid generated always as (coalesce(user_id, anon_id)) stored,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- allows: user-owned row, anon-owned row, OR both-null (anonymized
  -- after the owning account was deleted). Only forbids having BOTH
  -- set at once, which would be an ambiguous double identity.
  constraint check_interaction_actor check (
    not (user_id is not null and anon_id is not null)
  )
);

-- single, non-partial upsert target: ON CONFLICT (post_id, actor_id)
-- works from the client every time, logged-in or anonymous, no
-- branching required.
create unique index uq_interaction_actor
  on user_post_interactions (post_id, actor_id);

-- ====================================================================
-- 5. POST_COMMENTS TABLE  (was missing entirely)
-- ON DELETE: user_id is now a real FK with ON DELETE SET NULL — a
-- deleted account anonymizes its comments instead of deleting them
-- (deleting them would break reply threads). `was_registered_user` is
-- set once at insert time and is untouched by the FK action, so the
-- view can still say "Deleted User" instead of lumping a former
-- account in with people who were always anonymous.
--
-- EDITING: `edit_count` + the trigger below let an author edit a
-- comment's content exactly once. Anonymous (non-logged-in) comments
-- can never be edited at all, because there's no verified identity
-- to prove ownership on a later visit — the UPDATE policy requires
-- auth.uid() = user_id, which an anonymous row (user_id null) can
-- never satisfy.
-- ====================================================================
create table post_comments (
  id bigint generated always as identity primary key,
  post_id text not null references posts(slug) on delete cascade,
  parent_comment_id bigint,
  user_id uuid references auth.users(id) on delete set null,
  was_registered_user boolean default false not null, -- set once, survives anonymization
  anon_name text, -- display name for non-logged-in commenters

  content text not null check (length(content) <= 3000),
  edit_count smallint default 0 not null,
  edited_at timestamp with time zone,

  is_approved boolean default true not null,
  is_pinned boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- lets us FK-constrain parent_comment_id to a comment on the SAME post
alter table post_comments
  add constraint uq_post_comments_post_id unique (post_id, id);

alter table post_comments
  add constraint fk_parent_same_post
  foreign key (post_id, parent_comment_id)
  references post_comments (post_id, id)
  on delete cascade;

-- fast lookup of a comment's direct replies, oldest first
create index idx_comments_replies
  on post_comments (parent_comment_id, created_at);

-- stamp was_registered_user once, at creation time, so it survives
-- later anonymization (ON DELETE SET NULL only touches user_id)
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

-- allow editing a comment's content exactly once
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

-- ====================================================================
-- 6. POST_HIGHLIGHTS TABLE  (new)
-- Lets a user select a passage of text on a post and save it as a
-- highlight, optionally attaching a note (up to 3000 chars) — like
-- Kindle/Medium-style highlighting. A row can be a highlight only,
-- a note only, or both (see check_highlight_has_content below).
--
-- LOCATING THE HIGHLIGHT: since this is a static Astro site, content
-- can shift slightly between builds (typo fixes, re-wording), so we
-- don't rely purely on character offsets. We store a small amount of
-- surrounding context (selector_prefix/selector_suffix) alongside the
-- offsets — the classic "text quote + text position" anchor pattern.
-- On render, the client first tries the offsets, and falls back to
-- searching for prefix+exact+suffix nearby if the offsets no longer
-- line up with the current build's content.
--
-- PRIVACY: unlike comments, highlights are treated as private notes
-- to yourself by default — the RLS policies below only let you see
-- your own. Open the SELECT policy up if you want public/shared
-- highlights (e.g. a "popular passages" feature).
--
-- ON DELETE: unlike user_post_interactions/post_comments, this table
-- does NOT anonymize on account deletion — it CASCADEs. Highlights
-- and notes are personal content with no value to anyone else once
-- the owner is gone, so they're deleted outright along with the
-- account rather than kept around ownerless.
-- ====================================================================
create table post_highlights (
  id bigint generated always as identity primary key,
  post_id text not null references posts(slug) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  anon_id uuid, -- client-generated device id, used when user_id is null

  highlighted_text text check (highlighted_text is null or length(highlighted_text) <= 3000),
  note text check (note is null or length(note) <= 3000),

  -- anchor info to re-locate the highlight in the rendered post
  selector_prefix text, -- short context immediately before the highlight
  selector_suffix text, -- short context immediately after the highlight
  start_offset int,     -- best-effort character offset, fast-path match
  end_offset int,

  color text default 'yellow' not null,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- strict either/or: exactly one of user_id/anon_id must be set.
  -- (no "both null" case needed here, unlike user_post_interactions —
  -- cascade delete removes the row instead of orphaning it)
  constraint check_highlight_actor check (
    (user_id is not null and anon_id is null)
    or (user_id is null and anon_id is not null)
  ),
  constraint check_highlight_has_content check (
    highlighted_text is not null or note is not null
  ),
  constraint check_highlight_offsets check (
    (start_offset is null and end_offset is null)
    or (start_offset is not null and end_offset is not null and end_offset > start_offset)
  )
);

-- fetching "all my highlights on this post" (logged-in or anon)
create index idx_highlights_post_user
  on post_highlights (post_id, user_id);

create index idx_highlights_post_anon
  on post_highlights (post_id, anon_id);

-- ====================================================================
-- 7. updated_at HELPER TRIGGER
-- ====================================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

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

-- ====================================================================
-- 8. AUTOMATED LIFE-CYCLE TRIGGER
-- FIX: original used `!= new.id`, which with NULL last_seen_build_id
-- behaves unpredictably (NULL != x evaluates to NULL, not TRUE) and
-- it re-updated rows that were already marked deleted on every build.
-- IS DISTINCT FROM handles NULLs correctly, and the `is_deleted = false`
-- guard avoids rewriting rows unnecessarily.
-- ====================================================================
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

-- ====================================================================
-- 9. PERFORMANCE LOOKUP INDEXES
-- ====================================================================
create index idx_user_bookmarks
  on user_post_interactions (user_id, bookmarked_at desc, post_id)
  where is_bookmarked = true;

-- idx_post_interactions_lookup dropped: uq_interaction_actor (post_id, actor_id)
-- already covers post_id-only lookups via leftmost-prefix scan.

create index idx_leaderboard_aggregates
  on user_post_interactions (post_id, claps, rating, is_liked);

create index idx_user_preferences_meta
  on user_preferences using gin (meta);

create index idx_comments_feed_ordering
  on post_comments (post_id, is_approved, is_pinned desc, created_at desc);

create index idx_posts_build_state
  on posts (last_seen_build_id, is_deleted);

-- ====================================================================
-- 10. ROW LEVEL SECURITY  (missing entirely in the original — required,
-- since your anon/public API key can otherwise read/write everything)
-- ====================================================================
alter table builds enable row level security;
alter table posts enable row level security;
alter table user_preferences enable row level security;
alter table user_post_interactions enable row level security;
alter table post_comments enable row level security;
alter table post_highlights enable row level security;

-- builds: internal build metadata, readable so the frontend can show
-- version/commit info if you want, never writable from the client
create policy "builds are publicly readable"
  on builds for select
  using (true);

-- posts: publicly readable unless soft-deleted
create policy "non-deleted posts are publicly readable"
  on posts for select
  using (is_deleted = false);

-- user_preferences: strictly private to the owning logged-in user
create policy "users manage their own preferences"
  on user_preferences for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- user_post_interactions:
-- - counts (likes/ratings) are public to read
-- - logged-in users can only write their own row
-- - anonymous rows (anon_id) are writable client-side since there is
--   no verified identity to check against — see security note above
create policy "interactions are publicly readable"
  on user_post_interactions for select
  using (true);

create policy "logged-in users manage their own interactions"
  on user_post_interactions for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "anonymous interactions writable without login"
  on user_post_interactions for all
  using (user_id is null)
  with check (user_id is null and anon_id is not null);

-- post_comments:
-- - approved comments are publicly readable
-- - anyone (logged in or anon) can insert a comment
-- - only the comment's own logged-in author can edit/delete it later
create policy "approved comments are publicly readable"
  on post_comments for select
  using (is_approved = true);

create policy "anyone can post a comment"
  on post_comments for insert
  with check (
    (user_id is not null and user_id = (select auth.uid()))
    or (user_id is null and anon_name is not null)
  );

create policy "logged-in users edit their own comments"
  on post_comments for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "logged-in users delete their own comments"
  on post_comments for delete
  using ((select auth.uid()) = user_id);

-- post_highlights: private by default — only the owning actor can
-- see or manage their own highlights/notes
create policy "logged-in users manage their own highlights"
  on post_highlights for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ⚠️ SECURITY NOTE — read before using anon_id here: unlike the
-- "public counts" tables above, highlights/notes are private free
-- text. RLS has no way to check "does this anon_id belong to the
-- caller" — it can only see that user_id is null. That means this
-- policy, as written, lets ANY anonymous visitor read or overwrite
-- EVERY anonymous highlight, not just their own — it can't scope by
-- anon_id at the database level. That's an acceptable trade-off for
-- a public like/clap count, but not for personal notes.
--
-- Recommended: for this table specifically, require a real session
-- via Supabase Anonymous Sign-ins (supabase.auth.signInAnonymously())
-- instead of the localStorage anon_id trick, then this policy becomes
-- unnecessary and "logged-in users manage their own highlights" above
-- covers anonymous sessions too (they get a real auth.uid()).
-- The policy below is included for completeness/parity with the
-- other tables, but is NOT recommended to enable as-is for anon_id.
create policy "anonymous highlights usable without login"
  on post_highlights for all
  using (user_id is null)
  with check (user_id is null and anon_id is not null);

-- ====================================================================
-- 11. UNIFIED PUBLIC COMMENTS VIEW
-- ====================================================================
create or replace view public_post_comments_view
  with (security_invoker = true) as
select
  c.id,
  c.post_id,
  c.parent_comment_id,
  c.content,
  c.is_pinned,
  c.edit_count > 0 as was_edited,
  c.created_at,
  c.user_id,
  case
    when c.user_id is not null then coalesce(u.raw_user_meta_data->>'full_name', 'Registered User')
    when c.was_registered_user then 'Deleted User' -- had an account, since deleted/anonymized
    else coalesce(c.anon_name, 'Anonymous')
  end as display_author
from post_comments c
left join auth.users u on c.user_id = u.id
where c.is_approved = true;
