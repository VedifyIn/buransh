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

-- One row per published post. Slug is the stable URL key.
-- first/last_release_build_id track which build introduced and last
-- shipped each post, used by the deletion lifecycle trigger.
create table if not exists posts (
  slug text primary key,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  first_release_build_id bigint references builds(id) on delete set null,
  last_seen_build_id bigint references builds(id) on delete set null,
  is_deleted boolean default false not null
);
