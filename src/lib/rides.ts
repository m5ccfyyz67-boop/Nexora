import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, RideCategory, RideRow } from '../types/database';

export type RideSummary = Pick<
  RideRow,
  | 'id'
  | 'driver_user_id'
  | 'category'
  | 'status'
  | 'pickup_label'
  | 'dropoff_label'
  | 'created_at'
  | 'requested_at'
  | 'estimated_distance_km'
  | 'estimated_duration_minutes'
  | 'estimated_price_xof'
>;

export async function createRideRequest(
  client: SupabaseClient<Database>,
  input: { pickup: string; destination: string; category: RideCategory; requestId: string },
): Promise<string> {
  const { data, error } = await client.rpc('create_ride_request', {
    p_pickup_label: input.pickup,
    p_dropoff_label: input.destination,
    p_category: input.category,
    p_client_request_id: input.requestId,
  });
  if (error) throw error;
  if (!data) throw new Error('La demande a été reçue sans identifiant de course.');
  return data;
}

export async function cancelRideRequest(
  client: SupabaseClient<Database>,
  rideId: string,
): Promise<string> {
  const { data, error } = await client.rpc('cancel_ride_request', { p_ride_id: rideId });
  if (error) throw error;
  if (!data) throw new Error('La demande a été annulée sans identifiant de course.');
  return data;
}

export async function listMyRides(client: SupabaseClient<Database>): Promise<RideSummary[]> {
  const { data, error } = await client
    .from('rides')
    .select('id, driver_user_id, category, status, pickup_label, dropoff_label, created_at, requested_at, estimated_distance_km, estimated_duration_minutes, estimated_price_xof')
    .order('created_at', { ascending: false })
    .limit(25);
  if (error) throw error;
  return data ?? [];
}
