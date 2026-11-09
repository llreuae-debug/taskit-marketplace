export type PropertyListingType =
  | 'for_sale'
  | 'for_rent'
  | 'wanted_to_buy'
  | 'wanted_to_rent'
  | 'commercial_sale'
  | 'commercial_rental'
  | 'plot_sale'
  | 'new_project'
  | 'development_project';

export type PropertyTypeCategory =
  | 'house'
  | 'apartment'
  | 'plot_residential'
  | 'plot_commercial'
  | 'shop'
  | 'office'
  | 'building'
  | 'agricultural_land'
  | 'industrial_property'
  | 'penthouse'
  | 'villa';

export type PropertySizeUnit =
  | 'marla'
  | 'kanal'
  | 'sq_ft'
  | 'sq_yd'
  | 'acres'
  | 'sq_m';

export type PropertyVerificationStatus =
  | 'draft'
  | 'pending_review'
  | 'under_verification'
  | 'verified'
  | 'rejected'
  | 'suspended';

export type PropertyListingStatus =
  | 'active'
  | 'under_offer'
  | 'sold'
  | 'rented'
  | 'archived'
  | 'paused';

export type PropertyInquiryStatus =
  | 'new'
  | 'contacted'
  | 'viewing_scheduled'
  | 'negotiating'
  | 'offer_submitted'
  | 'accepted'
  | 'rejected'
  | 'closed';

export type ViewingAppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'rescheduled'
  | 'completed'
  | 'cancelled';

export interface PropertyCategory {
  id: string;
  slug: string;
  name_en: string;
  name_ur: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export interface PropertyMediaItem {
  id: string;
  property_id: string;
  media_type: 'photo' | 'video' | 'floor_plan';
  storage_path: string;
  sort_order: number;
}

export interface PropertyDocumentItem {
  id: string;
  property_id: string;
  owner_id: string;
  document_type: string;
  storage_path: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  reviewed_at?: string | null;
  rejection_reason?: string | null;
}

export interface PropertyItem {
  id: string;
  owner_id: string;
  category_id?: string | null;
  title: string;
  description: string;
  listing_type: PropertyListingType;
  property_type: PropertyTypeCategory;
  price: number;
  currency: string;
  country: string;
  city: string;
  area: string;
  society?: string | null;
  street_address?: string | null;
  hide_exact_address: boolean;
  latitude?: number | null;
  longitude?: number | null;
  land_size: number;
  size_unit: PropertySizeUnit;
  covered_area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floors?: number | null;
  parking_spaces?: number | null;
  furnishing_status: 'unfurnished' | 'semi_furnished' | 'furnished';
  construction_status: 'ready' | 'under_construction' | 'off_plan';
  ownership_status: 'freehold' | 'leasehold' | 'power_of_attorney';
  is_agent_listing: boolean;
  // 3-Tier Verification
  verification_status: PropertyVerificationStatus;
  documents_reviewed: boolean;
  verified_listing: boolean;
  listing_status: PropertyListingStatus;
  featured_until?: string | null;
  views_count: number;
  inquiries_count: number;
  favourites_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields for display
  owner?: {
    full_name: string;
    avatar_url?: string | null;
    kyc_status: string;
    is_verified_agent: boolean;
    seller_rating: number;
  };
  media?: PropertyMediaItem[];
  is_favourited?: boolean;
}

export interface PropertyInquiryItem {
  id: string;
  property_id: string;
  buyer_id: string;
  seller_id: string;
  message: string;
  offer_price?: number | null;
  status: PropertyInquiryStatus;
  created_at: string;
  buyer?: {
    full_name: string;
    avatar_url?: string | null;
    kyc_status: string;
  };
  property?: PropertyItem;
}

export interface PropertyViewingItem {
  id: string;
  property_id: string;
  inquiry_id?: string | null;
  buyer_id: string;
  seller_id: string;
  scheduled_at: string;
  status: ViewingAppointmentStatus;
  notes?: string | null;
  created_at: string;
  property?: PropertyItem;
  buyer?: {
    full_name: string;
  };
}

export interface PropertyProjectItem {
  id: string;
  developer_id: string;
  project_name: string;
  developer_name: string;
  description: string;
  city: string;
  location_address: string;
  latitude?: number | null;
  longitude?: number | null;
  construction_status: string;
  total_units?: number | null;
  price_from: number;
  price_to?: number | null;
  currency: string;
  is_verified_project: boolean;
  featured_until?: string | null;
  created_at: string;
  media?: string[];
}

export interface PropertyFilterOptions {
  searchQuery?: string;
  city?: string;
  area?: string;
  society?: string;
  listingType?: PropertyListingType | 'all';
  propertyType?: PropertyTypeCategory | 'all';
  minPrice?: number;
  maxPrice?: number;
  minSize?: number;
  maxSize?: number;
  sizeUnit?: PropertySizeUnit;
  bedrooms?: number;
  bathrooms?: number;
  verifiedOnly?: boolean;
  featuredOnly?: boolean;
  constructionStatus?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'size_desc' | 'popular';
}
