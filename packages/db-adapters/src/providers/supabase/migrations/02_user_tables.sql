-- ====================================================================
-- 02: USER TABLES
-- Per-user settings. FK to auth.users — CASCADE on delete because
-- there's nothing useful to anonymize in a primary-key settings row.
-- ====================================================================

create table if not exists user_preferences (
  user_id uuid references auth.users(id) on delete cascade primary key,
  theme text default 'system'::text not null
    check (theme in ('light', 'dark', 'system')),
  font_size smallint default 3 not null
    check (font_size between 1 and 5),
  read_mode smallint default 1 not null
    check (read_mode between 1 and 3),
  meta jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
