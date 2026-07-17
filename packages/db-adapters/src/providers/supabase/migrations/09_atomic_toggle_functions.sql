-- ====================================================================
-- 09: ATOMIC TOGGLE FUNCTIONS
-- Database functions for race-condition-free toggle operations.
-- Eliminates read-then-write patterns in the application layer.
-- ====================================================================

-- Atomic bookmark toggle: flip the current state in a single operation.
-- Returns the new state. Creates row if it doesn't exist.
create or replace function toggle_bookmark(
  p_post_id uuid,
  p_user_id uuid default null,
  p_anon_id uuid default null
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_actor_id uuid;
  v_new_state boolean;
begin
  -- Compute actor_id (matches the generated column logic)
  v_actor_id := coalesce(p_user_id, p_anon_id);
  
  if v_actor_id is null then
    raise exception 'Either user_id or anon_id must be provided';
  end if;

  -- Upsert with atomic NOT toggle
  insert into user_post_interactions (
    post_id,
    user_id,
    anon_id,
    is_bookmarked,
    bookmarked_at
  ) values (
    p_post_id,
    p_user_id,
    case when p_user_id is null then p_anon_id else null end,
    true,
    timezone('utc'::text, now())
  )
  on conflict (post_id, actor_id)
  do update set
    is_bookmarked = not user_post_interactions.is_bookmarked,
    bookmarked_at = case
      when not user_post_interactions.is_bookmarked then timezone('utc'::text, now())
      else null
    end
  returning is_bookmarked into v_new_state;

  return v_new_state;
end;
$$;

-- Atomic like toggle: flip the current state in a single operation.
-- Returns the new state. Creates row if it doesn't exist.
create or replace function toggle_like(
  p_post_id uuid,
  p_user_id uuid default null,
  p_anon_id uuid default null
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_actor_id uuid;
  v_new_state boolean;
begin
  v_actor_id := coalesce(p_user_id, p_anon_id);
  
  if v_actor_id is null then
    raise exception 'Either user_id or anon_id must be provided';
  end if;

  insert into user_post_interactions (
    post_id,
    user_id,
    anon_id,
    is_liked
  ) values (
    p_post_id,
    p_user_id,
    case when p_user_id is null then p_anon_id else null end,
    true
  )
  on conflict (post_id, actor_id)
  do update set
    is_liked = not user_post_interactions.is_liked
  returning is_liked into v_new_state;

  return v_new_state;
end;
$$;

-- Grant execute permissions to authenticated and anonymous users
grant execute on function toggle_bookmark(uuid, uuid, uuid) to authenticated, anon;
grant execute on function toggle_like(uuid, uuid, uuid) to authenticated, anon;
