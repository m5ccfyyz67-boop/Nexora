-- Make the same passenger/request key atomic even when retries overlap.
create or replace function public.create_ride_request(
  p_pickup_label text,
  p_dropoff_label text,
  p_category public.ride_category,
  p_client_request_id uuid,
  p_pickup_latitude numeric default null,
  p_pickup_longitude numeric default null,
  p_dropoff_latitude numeric default null,
  p_dropoff_longitude numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_ride_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_client_request_id is null then
    raise exception 'A request id is required' using errcode = '22023';
  end if;
  if p_pickup_label is null or char_length(trim(p_pickup_label)) not between 2 and 300
     or p_dropoff_label is null or char_length(trim(p_dropoff_label)) not between 2 and 300 then
    raise exception 'Pickup and destination are required' using errcode = '22023';
  end if;
  if (p_pickup_latitude is null) <> (p_pickup_longitude is null)
     or (p_dropoff_latitude is null) <> (p_dropoff_longitude is null) then
    raise exception 'Latitude and longitude must be supplied in pairs' using errcode = '22023';
  end if;
  if p_pickup_latitude is not null and (p_pickup_latitude < -90 or p_pickup_latitude > 90
     or p_pickup_longitude < -180 or p_pickup_longitude > 180) then
    raise exception 'Pickup coordinates are out of range' using errcode = '22023';
  end if;
  if p_dropoff_latitude is not null and (p_dropoff_latitude < -90 or p_dropoff_latitude > 90
     or p_dropoff_longitude < -180 or p_dropoff_longitude > 180) then
    raise exception 'Destination coordinates are out of range' using errcode = '22023';
  end if;

  insert into public.rides (
    passenger_user_id, client_request_id, category, status,
    pickup_label, pickup_latitude, pickup_longitude,
    dropoff_label, dropoff_latitude, dropoff_longitude
  ) values (
    v_user_id, p_client_request_id, p_category, 'searching',
    trim(p_pickup_label), p_pickup_latitude, p_pickup_longitude,
    trim(p_dropoff_label), p_dropoff_latitude, p_dropoff_longitude
  )
  on conflict (passenger_user_id, client_request_id) do nothing
  returning id into v_ride_id;

  if v_ride_id is null then
    select r.id into v_ride_id
    from public.rides r
    where r.passenger_user_id = v_user_id
      and r.client_request_id = p_client_request_id;
    return v_ride_id;
  end if;

  insert into public.ride_events (ride_id, actor_user_id, event_type, from_status, to_status)
  values (v_ride_id, v_user_id, 'ride_requested', null, 'searching');

  return v_ride_id;
end;
$$;

revoke all on function public.create_ride_request(text, text, public.ride_category, uuid, numeric, numeric, numeric, numeric)
  from public, anon, authenticated;
grant execute on function public.create_ride_request(text, text, public.ride_category, uuid, numeric, numeric, numeric, numeric)
  to authenticated;
