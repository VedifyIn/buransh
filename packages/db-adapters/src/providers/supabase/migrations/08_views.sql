-- ====================================================================
-- 08: VIEWS
-- Materialized views for common query patterns. security_invoker = true
-- ensures the view runs with the caller's privileges and respects the
-- underlying table's RLS policies.
-- ====================================================================

-- Unified public comments view. Joins post_comments with auth.users
-- to resolve display names. Used by the comments widget to avoid
-- exposing raw user_ids or anon_names directly.
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
    when c.was_registered_user then 'Deleted User'
    else coalesce(c.anon_name, 'Anonymous')
  end as display_author
from post_comments c
left join auth.users u on c.user_id = u.id
where c.is_approved = true;
