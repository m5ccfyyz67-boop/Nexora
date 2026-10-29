export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type RideCategory = 'economique' | 'confort' | 'premium';
export type RideStatus =
  | 'searching'
  | 'assigned'
  | 'driver_en_route'
  | 'driver_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_driver';

export type RideRow = {
  id: string;
  passenger_user_id: string;
  driver_user_id: string | null;
  category: RideCategory;
  status: RideStatus;
  pickup_label: string;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  dropoff_label: string;
  dropoff_latitude: number | null;
  dropoff_longitude: number | null;
  estimated_distance_km: number | null;
  estimated_duration_minutes: number | null;
  estimated_price_xof: number | null;
  final_distance_km: number | null;
  final_price_xof: number | null;
  requested_at: string;
  assigned_at: string | null;
  driver_arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  client_request_id: string;
};

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.18' };
  public: {
    Tables: {
      profiles: Table<
        { id: string; full_name: string; phone_e164: string | null; created_at: string; updated_at: string },
        { id: string; full_name?: string; phone_e164?: string | null; created_at?: string; updated_at?: string },
        { id?: string; full_name?: string; phone_e164?: string | null; created_at?: string; updated_at?: string }
      >;
      driver_profiles: Table<
        { user_id: string; verification_status: 'pending' | 'approved' | 'rejected' | 'suspended'; created_at: string; updated_at: string },
        { user_id: string; verification_status?: 'pending' | 'approved' | 'rejected' | 'suspended'; created_at?: string; updated_at?: string },
        { user_id?: string; verification_status?: 'pending' | 'approved' | 'rejected' | 'suspended'; created_at?: string; updated_at?: string }
      >;
      vehicles: Table<
        { id: string; driver_user_id: string; make: string; model: string; color: string | null; license_plate: string; category: RideCategory; seats: number; verification_status: 'pending' | 'approved' | 'rejected' | 'suspended'; created_at: string; updated_at: string },
        { id?: string; driver_user_id: string; make: string; model: string; color?: string | null; license_plate: string; category: RideCategory; seats?: number; verification_status?: 'pending' | 'approved' | 'rejected' | 'suspended'; created_at?: string; updated_at?: string },
        { id?: string; driver_user_id?: string; make?: string; model?: string; color?: string | null; license_plate?: string; category?: RideCategory; seats?: number; verification_status?: 'pending' | 'approved' | 'rejected' | 'suspended'; created_at?: string; updated_at?: string }
      >;
      rides: Table<
        RideRow,
        Partial<RideRow> & Pick<RideRow, 'passenger_user_id' | 'category' | 'pickup_label' | 'dropoff_label'>,
        Partial<RideRow>
      >;
      ride_events: Table<
        { id: string; ride_id: string; actor_user_id: string | null; event_type: string; from_status: RideStatus | null; to_status: RideStatus; metadata: Json; created_at: string },
        { id?: string; ride_id: string; actor_user_id?: string | null; event_type: string; from_status?: RideStatus | null; to_status: RideStatus; metadata?: Json; created_at?: string },
        { id?: string; ride_id?: string; actor_user_id?: string | null; event_type?: string; from_status?: RideStatus | null; to_status?: RideStatus; metadata?: Json; created_at?: string }
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      accept_ride: { Args: { p_ride_id: string }; Returns: string };
      advance_ride: { Args: { p_ride_id: string; p_next_status: RideStatus }; Returns: undefined };
      cancel_ride_request: { Args: { p_ride_id: string }; Returns: string };
      create_ride_request: {
        Args: {
          p_pickup_label: string;
          p_dropoff_label: string;
          p_category: RideCategory;
          p_client_request_id: string;
          p_pickup_latitude?: number;
          p_pickup_longitude?: number;
          p_dropoff_latitude?: number;
          p_dropoff_longitude?: number;
        };
        Returns: string;
      };
    };
    Enums: {
      ride_category: RideCategory;
      ride_status: RideStatus;
      driver_verification_status: 'pending' | 'approved' | 'rejected' | 'suspended';
      vehicle_verification_status: 'pending' | 'approved' | 'rejected' | 'suspended';
    };
    CompositeTypes: { [_ in never]: never };
  };
};
