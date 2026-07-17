-- ====================================================================
-- 01: BASE TABLES
-- Master tables with no foreign key dependencies on other app tables.
-- auth.users is Supabase's built-in table — always exists.
-- ====================================================================

-- Tracks Astro static build versions and commit targets.
-- The lifecycle trigger on this table marks stale posts as deleted.
create table if not exists builds (
  id bigint generated always as identity primary key,
  commit_id text not null,
  version text not null,
  build_date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- One row per published post. slug is mutable (renames allowed).
-- post_id is the immutable surrogate key — computed as
-- uuid_generate_v5(dns_namespace, slug) in the application layer
-- (sync-pipeline) on first creation, then never changes.
-- All interaction tables FK to post_id so renames are safe.
-- first/last_release_build_id track which build introduced and last
-- shipped each post, used by the deletion lifecycle trigger.
create table if not exists posts (
  slug text primary key,
  post_id uuid unique not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  first_release_build_id bigint references builds(id) on delete set null,
  last_seen_build_id bigint references builds(id) on delete set null,
  is_deleted boolean default false not null,

  -- Interaction Controls: 'enabled' (all), 'disabled' (locked), or 'auth_only' (registered)
  comments_state text default 'enabled' check (comments_state in ('enabled', 'disabled', 'auth_only')) not null,
  interactions_state text default 'enabled' check (interactions_state in ('enabled', 'disabled', 'auth_only')) not null,
  highlights_notes text default 'auth_only' check (highlights_notes in ('enabled', 'disabled', 'auth_only')) not null
);
