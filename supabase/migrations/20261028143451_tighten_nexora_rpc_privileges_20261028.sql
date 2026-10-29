-- Restrict RPC execution to signed-in callers where explicitly intended.
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

revoke all on function public.create_ride_request(text, text, public.ride_category, uuid, numeric, numeric, numeric, numeric)
  from public, anon, authenticated;
grant execute on function public.create_ride_request(text, text, public.ride_category, uuid, numeric, numeric, numeric, numeric)
  to authenticated;

revoke all on function public.accept_ride(uuid) from public, anon, authenticated;
grant execute on function public.accept_ride(uuid) to authenticated;

revoke all on function public.advance_ride(uuid, public.ride_status) from public, anon, authenticated;
grant execute on function public.advance_ride(uuid, public.ride_status) to authenticated;

-- A phone number is not editable until a verified-phone workflow is selected.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Cover the audit actor foreign key for efficient retention and account lookups.
create index ride_events_actor_user_id_idx on public.ride_events (actor_user_id);
