-- ====================================================================
-- 03: INTERACTION TABLES
-- One row per (post, actor) — backs claps, likes, bookmarks, ratings,
-- and mark-as-read. The generated actor_id column lets ON CONFLICT
-- work with a single non-partial unique index.
--
-- ON DELETE: SET NULL (not cascade) — anonymizes the row instead of
-- deleting it, preserving aggregate counts other users can see.
-- ====================================================================

create table if not exists user_post_interactions (
  id bigint generated always as identity primary key,
  post_id text not null references posts(slug) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  anon_id uuid,

  claps int default 0 not null check (claps >= 0),
  is_liked boolean default false not null,

  is_bookmarked boolean default false not null,
  bookmarked_at timestamp with time zone,

  is_read boolean default false not null,
  read_at timestamp with time zone,

  rating smallint check (rating is null or rating between 1 and 5),

  actor_id uuid generated always as (coalesce(user_id, anon_id)) stored,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  constraint check_interaction_actor check (
    not (user_id is not null and anon_id is not null)
  )
);

-- Single, non-partial upsert target. Works from the client every time
-- (logged-in or anonymous) with ON CONFLICT (post_id, actor_id).
create unique index if not exists uq_interaction_actor
  on user_post_interactions (post_id, actor_id);
