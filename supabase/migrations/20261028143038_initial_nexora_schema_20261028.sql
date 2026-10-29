-- NEXORA MOBILITY — initial application schema
-- No demo accounts, prices, packages, wallet balances, or payment records are inserted.

create type public.ride_category as enum ('economique', 'confort', 'premium');
create type public.ride_status as enum (
  'searching',
  'assigned',
  'driver_en_route',
  'driver_arrived',
  'in_progress',
  'completed',
  'cancelled',
  'no_driver'
);
create type public.driver_verification_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.vehicle_verification_status as enum ('pending', 'approved', 'rejected', 'suspended');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone_e164 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.driver_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  verification_status public.driver_verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  driver_user_id uuid not null references public.driver_profiles (user_id) on delete cascade,
  make text not null check (char_length(trim(make)) between 1 and 80),
  model text not null check (char_length(trim(model)) between 1 and 80),
  color text,
  license_plate text not null check (char_length(trim(license_plate)) between 2 and 24),
  category public.ride_category not null,
  seats smallint not null default 4 check (seats between 1 and 20),
  verification_status public.vehicle_verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index vehicles_license_plate_ci_uidx
  on public.vehicles (lower(trim(license_plate)));
create index vehicles_driver_user_id_idx on public.vehicles (driver_user_id);

create table public.rides (
  id uuid primary key default gen_random_uuid(),
  passenger_user_id uuid not null references public.profiles (id) on delete restrict,
  driver_user_id uuid references public.driver_profiles (user_id) on delete restrict,
  category public.ride_category not null,
  status public.ride_status not null default 'searching',
  pickup_label text not null check (char_length(trim(pickup_label)) between 2 and 300),
  pickup_latitude numeric(9, 6),
  pickup_longitude numeric(9, 6),
  dropoff_label text not null check (char_length(trim(dropoff_label)) between 2 and 300),
  dropoff_latitude numeric(9, 6),
  dropoff_longitude numeric(9, 6),
  estimated_distance_km numeric(9, 2) check (estimated_distance_km is null or estimated_distance_km >= 0),
  estimated_duration_minutes integer check (estimated_duration_minutes is null or estimated_duration_minutes >= 0),
  estimated_price_xof bigint check (estimated_price_xof is null or estimated_price_xof >= 0),
  final_distance_km numeric(9, 2) check (final_distance_km is null or final_distance_km >= 0),
  final_price_xof bigint check (final_price_xof is null or final_price_xof >= 0),
  requested_at timestamptz not null default now(),
  assigned_at timestamptz,
  driver_arrived_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rides_pickup_lat_lng_pair check ((pickup_latitude is null) = (pickup_longitude is null)),
  constraint rides_dropoff_lat_lng_pair check ((dropoff_latitude is null) = (dropoff_longitude is null)),
  constraint rides_pickup_latitude_range check (pickup_latitude is null or pickup_latitude between -90 and 90),
  constraint rides_pickup_longitude_range check (pickup_longitude is null or pickup_longitude between -180 and 180),
  constraint rides_dropoff_latitude_range check (dropoff_latitude is null or dropoff_latitude between -90 and 90),
  constraint rides_dropoff_longitude_range check (dropoff_longitude is null or dropoff_longitude between -180 and 180)
);

create unique index rides_one_active_per_passenger_uidx
  on public.rides (passenger_user_id)
  where status in ('searching', 'assigned', 'driver_en_route', 'driver_arrived', 'in_progress');
create unique index rides_one_active_per_driver_uidx
  on public.rides (driver_user_id)
  where driver_user_id is not null
    and status in ('assigned', 'driver_en_route', 'driver_arrived', 'in_progress');
create index rides_passenger_created_idx on public.rides (passenger_user_id, created_at desc);
create index rides_driver_created_idx on public.rides (driver_user_id, created_at desc);
create index rides_status_created_idx on public.rides (status, created_at);

create table public.ride_events (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides (id) on delete restrict,
  actor_user_id uuid references auth.users (id) on delete set null,
  event_type text not null check (char_length(trim(event_type)) between 1 and 80),
  from_status public.ride_status,
  to_status public.ride_status not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index ride_events_ride_created_idx on public.ride_events (ride_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.set_updated_at() from public;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger driver_profiles_set_updated_at
  before update on public.driver_profiles
  for each row execute function public.set_updated_at();
create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();
create trigger rides_set_updated_at
  before update on public.rides
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone_e164)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), ''),
    nullif(new.phone, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_auth_user() from public;
drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.driver_profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.rides enable row level security;
alter table public.ride_events enable row level security;

create policy profiles_select_self on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy driver_profiles_select_self on public.driver_profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy vehicles_select_owner on public.vehicles
  for select to authenticated using (driver_user_id = (select auth.uid()));

create policy rides_select_participant on public.rides
  for select to authenticated
  using (
    passenger_user_id = (select auth.uid())
    or driver_user_id = (select auth.uid())
  );

create policy ride_events_select_participant on public.ride_events
  for select to authenticated
  using (
    exists (
      select 1
      from public.rides r
      where r.id = ride_events.ride_id
        and (r.passenger_user_id = (select auth.uid()) or r.driver_user_id = (select auth.uid()))
    )
  );

revoke all on public.profiles, public.driver_profiles, public.vehicles, public.rides, public.ride_events from anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.driver_profiles, public.vehicles, public.rides, public.ride_events to authenticated;

create or replace function public.create_ride_request(
  p_pickup_label text,
  p_dropoff_label text,
  p_category public.ride_category,
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
    passenger_user_id, category, status,
    pickup_label, pickup_latitude, pickup_longitude,
    dropoff_label, dropoff_latitude, dropoff_longitude
  ) values (
    v_user_id, p_category, 'searching',
    trim(p_pickup_label), p_pickup_latitude, p_pickup_longitude,
    trim(p_dropoff_label), p_dropoff_latitude, p_dropoff_longitude
  ) returning id into v_ride_id;

  insert into public.ride_events (ride_id, actor_user_id, event_type, from_status, to_status)
  values (v_ride_id, v_user_id, 'ride_requested', null, 'searching');

  return v_ride_id;
end;
$$;
revoke all on function public.create_ride_request(text, text, public.ride_category, numeric, numeric, numeric, numeric) from public;
grant execute on function public.create_ride_request(text, text, public.ride_category, numeric, numeric, numeric, numeric) to authenticated;

create or replace function public.accept_ride(p_ride_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_status public.ride_status;
  v_category public.ride_category;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if not exists (
    select 1 from public.driver_profiles dp
    where dp.user_id = v_user_id and dp.verification_status = 'approved'
  ) or not exists (
    select 1 from public.vehicles v
    where v.driver_user_id = v_user_id and v.verification_status = 'approved'
  ) then
    raise exception 'Approved driver profile and vehicle required' using errcode = '42501';
  end if;

  select r.status, r.category into v_status, v_category
  from public.rides r
  where r.id = p_ride_id
  for update;
  if not found or v_status <> 'searching' then
    raise exception 'Ride is no longer available' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.vehicles v
    where v.driver_user_id = v_user_id
      and v.verification_status = 'approved'
      and v.category = v_category
  ) then
    raise exception 'No approved vehicle in this category' using errcode = '42501';
  end if;

  update public.rides
  set driver_user_id = v_user_id, status = 'assigned', assigned_at = now()
  where id = p_ride_id and status = 'searching' and driver_user_id is null;
  if not found then
    raise exception 'Ride is no longer available' using errcode = 'P0001';
  end if;

  insert into public.ride_events (ride_id, actor_user_id, event_type, from_status, to_status)
  values (p_ride_id, v_user_id, 'driver_accepted', 'searching', 'assigned');
  return p_ride_id;
end;
$$;
revoke all on function public.accept_ride(uuid) from public;
grant execute on function public.accept_ride(uuid) to authenticated;

create or replace function public.advance_ride(p_ride_id uuid, p_next_status public.ride_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_current_status public.ride_status;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  select r.status into v_current_status
  from public.rides r
  where r.id = p_ride_id and r.driver_user_id = v_user_id
  for update;
  if not found then
    raise exception 'Assigned ride not found' using errcode = 'P0002';
  end if;
  if not (
    (v_current_status = 'assigned' and p_next_status = 'driver_en_route')
    or (v_current_status = 'driver_en_route' and p_next_status = 'driver_arrived')
    or (v_current_status = 'driver_arrived' and p_next_status = 'in_progress')
    or (v_current_status = 'in_progress' and p_next_status = 'completed'
        and exists (select 1 from public.rides r where r.id = p_ride_id and r.final_price_xof is not null))
  ) then
    raise exception 'Invalid or unfinalized ride transition' using errcode = 'P0001';
  end if;

  update public.rides
  set status = p_next_status,
      driver_arrived_at = case when p_next_status = 'driver_arrived' then now() else driver_arrived_at end,
      started_at = case when p_next_status = 'in_progress' then now() else started_at end,
      completed_at = case when p_next_status = 'completed' then now() else completed_at end
  where id = p_ride_id;

  insert into public.ride_events (ride_id, actor_user_id, event_type, from_status, to_status)
  values (p_ride_id, v_user_id, 'driver_status_transition', v_current_status, p_next_status);
end;
$$;
revoke all on function public.advance_ride(uuid, public.ride_status) from public;
grant execute on function public.advance_ride(uuid, public.ride_status) to authenticated;
