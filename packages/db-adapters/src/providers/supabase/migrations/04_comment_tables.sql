-- ====================================================================
-- 04: COMMENT TABLES
-- Threaded comments with edit-once semantics. ON DELETE SET NULL on
-- user_id anonymizes comments from deleted accounts without breaking
-- reply threads. was_registered_user is stamped once at insert and
-- survives later anonymization.
-- ====================================================================

create table if not exists post_comments (
  id bigint generated always as identity primary key,
  post_id text not null references posts(slug) on delete cascade,
  parent_comment_id bigint,
  user_id uuid references auth.users(id) on delete set null,
  was_registered_user boolean default false not null,
  anon_name text,

  content text not null check (length(content) <= 3000),
  edit_count smallint default 0 not null,
  edited_at timestamp with time zone,

  is_approved boolean default true not null,
  is_pinned boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- FK-constrain parent_comment_id to a comment on the SAME post.
alter table post_comments
  add constraint uq_post_comments_post_id unique (post_id, id);

alter table post_comments
  add constraint fk_parent_same_post
  foreign key (post_id, parent_comment_id)
  references post_comments (post_id, id)
  on delete cascade;

-- Fast lookup of a comment's direct replies, oldest first.
create index if not exists idx_comments_replies
  on post_comments (parent_comment_id, created_at);
