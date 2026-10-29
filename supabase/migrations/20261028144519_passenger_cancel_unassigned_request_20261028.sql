-- Let a passenger release their sole active slot only before any driver is assigned.
create or replace function public.cancel_ride_request(p_ride_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_current_status public.ride_status;
  v_driver_user_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select r.status, r.driver_user_id
  into v_current_status, v_driver_user_id
  from public.rides r
  where r.id = p_ride_id and r.passenger_user_id = v_user_id
  for update;

  if not found then
    raise exception 'Ride not found' using errcode = 'P0002';
  end if;

  -- Return the same result on a retry without adding another event.
  if v_current_status = 'cancelled' and v_driver_user_id is null then
    return p_ride_id;
  end if;

  if v_current_status <> 'searching' or v_driver_user_id is not null then
    raise exception 'Only an unassigned ride request can be cancelled' using errcode = '55000';
  end if;

  update public.rides
  set status = 'cancelled', cancelled_at = now()
  where id = p_ride_id;

  insert into public.ride_events (ride_id, actor_user_id, event_type, from_status, to_status)
  values (p_ride_id, v_user_id, 'passenger_cancelled_unassigned_request', 'searching', 'cancelled');

  return p_ride_id;
end;
$$;

revoke all on function public.cancel_ride_request(uuid) from public, anon, authenticated;
grant execute on function public.cancel_ride_request(uuid) to authenticated;
