export type TaskStatus =
  | 'draft'
  | 'open'
  | 'accepted'
  | 'in_progress'
  | 'submitted'
  | 'completed'
  | 'rated'
  | 'cancelled'
  | 'expired'
  | 'disputed'
  | 'resolved';

export type TaskAcceptanceMethod = 'instant' | 'offer_only' | 'both';

export type TaskLocationType =
  | 'physical_single'
  | 'physical_pickup_dropoff'
  | 'online';

export interface CategoryCustomField {
  name: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  label?: string;
  options?: string[];
  required?: boolean;
}

export interface TaskCategory {
  id: string;
  slug: string;
  name_en: string;
  name_ur: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  custom_fields: CategoryCustomField[];
}

export interface TaskItem {
  id: string;
  poster_id: string;
  tasker_id: string | null;
  category_id: string;
  title: string;
  description: string;
  voice_note_path?: string | null;
  photos: string[];
  location_type: TaskLocationType;
  location_name?: string | null;
  location_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  pickup_name?: string | null;
  pickup_address?: string | null;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  dropoff_name?: string | null;
  dropoff_address?: string | null;
  dropoff_latitude?: number | null;
  dropoff_longitude?: number | null;
  currency: string;
  task_charges: number;
  expense_budget: number;
  service_fee: number;
  tasker_amount: number;
  deadline: string;
  acceptance_method: TaskAcceptanceMethod;
  status: TaskStatus;
  completion_code?: string | null;
  accepted_at?: string | null;
  started_at?: string | null;
  submitted_at?: string | null;
  completed_at?: string | null;
  auto_approval_deadline?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  disputed_at?: string | null;
  custom_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined fields for display
  poster?: {
    full_name: string;
    avatar_url?: string | null;
    kyc_status: string;
    poster_rating: number;
  };
  category?: TaskCategory;
  distance_km?: number;
}

export interface TaskOffer {
  id: string;
  task_id: string;
  tasker_id: string;
  offered_price: number;
  comment?: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
  tasker?: {
    full_name: string;
    avatar_url?: string | null;
    tasker_rating: number;
  };
}

export interface TaskFilterOptions {
  searchQuery?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  locationType?: TaskLocationType | 'all';
  maxDistanceKm?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'deadline' | 'distance';
  userCoords?: { latitude: number; longitude: number };
}
