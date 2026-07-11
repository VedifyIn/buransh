-- ====================================================================
-- 07: ROW LEVEL SECURITY
-- All RLS policies in one file, at the end of the migration sequence.
-- All auth.uid() calls wrapped as (select auth.uid()) for per-statement
-- caching instead of per-row evaluation.
-- ====================================================================

-- Enable RLS on all tables. Without this, the anon/public API key
-- can read/write everything.
alter table builds enable row level security;
alter table posts enable row level security;
alter table user_preferences enable row level security;
alter table user_post_interactions enable row level security;
alter table post_comments enable row level security;
alter table post_highlights enable row level security;

-- ── builds ──────────────────────────────────────────────────────────
-- Internal build metadata. Publicly readable, never writable from client.

create policy "builds are publicly readable"
  on builds for select
  using (true);

-- ── posts ───────────────────────────────────────────────────────────
-- Publicly readable unless soft-deleted.

create policy "non-deleted posts are publicly readable"
  on posts for select
  using (is_deleted = false);

-- ── user_preferences ────────────────────────────────────────────────
-- Strictly private to the owning logged-in user.

create policy "users manage their own preferences"
  on user_preferences for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── user_post_interactions ──────────────────────────────────────────
-- Counts (likes/ratings) are public to read.
-- Logged-in users can only write their own row.
-- Anonymous rows are writable client-side (no verified identity).

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

-- ── post_comments ───────────────────────────────────────────────────
-- Approved comments are publicly readable.
-- Anyone (logged in or anon) can insert.
-- Only the comment's own logged-in author can edit/delete.

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

-- ── post_highlights ─────────────────────────────────────────────────
-- Private by default — only the owning actor can manage their own.
-- SECURITY NOTE: the anon_id policy below lets ANY anonymous visitor
-- read/write EVERY anonymous highlight. For real privacy, use
-- Supabase Anonymous Sign-ins (supabase.auth.signInAnonymously())
-- instead of localStorage anon_id, which gives anon sessions a real
-- auth.uid() and makes the logged-in policy cover them.

create policy "logged-in users manage their own highlights"
  on post_highlights for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Included for completeness/parity. NOT recommended for production
-- with localStorage anon_id — see security note above.
create policy "anonymous highlights usable without login"
  on post_highlights for all
  using (user_id is null)
  with check (user_id is null and anon_id is not null);
