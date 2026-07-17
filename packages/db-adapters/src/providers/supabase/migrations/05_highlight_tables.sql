-- ====================================================================
-- 05: HIGHLIGHT TABLES
-- Private text highlights and notes (Kindle/Medium-style). Uses the
-- "text quote + text position" anchor pattern so highlights survive
-- minor content changes between builds.
--
-- ON DELETE: CASCADE (not anonymize) — personal content with no value
-- to anyone else once the owner is gone.
-- ====================================================================

create table if not exists post_highlights (
  id bigint generated always as identity primary key,
  post_id uuid not null references posts(post_id) on update cascade on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  anon_id uuid,

  highlighted_text text check (highlighted_text is null or length(highlighted_text) <= 3000),
  note text check (note is null or length(note) <= 3000),

  selector_prefix text,
  selector_suffix text,
  start_offset int,
  end_offset int,

  color text default 'yellow' not null,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

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

-- Fetching "all my highlights on this post" (logged-in or anon).
create index if not exists idx_highlights_post_user
  on post_highlights (post_id, user_id);

create index if not exists idx_highlights_post_anon
  on post_highlights (post_id, anon_id);
