import { supabase, isSupabaseConfigured } from '../../services/supabase';
import {
  PropertyItem,
  PropertyCategory,
  PropertyFilterOptions,
  PropertyInquiryItem,
  PropertyViewingItem,
  PropertyProjectItem,
  PropertyVerificationStatus,
  ViewingAppointmentStatus,
  PropertyInquiryStatus,
} from '../../types/realEstate';
import { PropertyCreationInput, convertToSquareFeet } from './validation';

// 15 Standard Real Estate Categories
export const INITIAL_PROPERTY_CATEGORIES: PropertyCategory[] = [
  { id: 'pcat-1', slug: 'buy-property', name_en: 'Buy Property', name_ur: 'پراپرٹی خریدیں', icon: '🔑', sort_order: 1, is_active: true },
  { id: 'pcat-2', slug: 'sell-property', name_en: 'Sell Property', name_ur: 'پراپرٹی فروخت کریں', icon: '🏷️', sort_order: 2, is_active: true },
  { id: 'pcat-3', slug: 'rent-property', name_en: 'Rent Property', name_ur: 'کرائے پر دیں یا لیں', icon: '🏢', sort_order: 3, is_active: true },
  { id: 'pcat-4', slug: 'find-property', name_en: 'Find a Property', name_ur: 'پراپرٹی تلاش کریں', icon: '🔍', sort_order: 4, is_active: true },
  { id: 'pcat-5', slug: 'residential', name_en: 'Residential Property', name_ur: 'رہائشی پراپرٹی', icon: '🏡', sort_order: 5, is_active: true },
  { id: 'pcat-6', slug: 'commercial', name_en: 'Commercial Property', name_ur: 'کمرشل پراپرٹی', icon: '🏬', sort_order: 6, is_active: true },
  { id: 'pcat-7', slug: 'plots-land', name_en: 'Plots & Land', name_ur: 'پلاٹس اور اراضی', icon: '📐', sort_order: 7, is_active: true },
  { id: 'pcat-8', slug: 'houses', name_en: 'Houses', name_ur: 'مکانات اور ولاز', icon: '🏠', sort_order: 8, is_active: true },
  { id: 'pcat-9', slug: 'apartments', name_en: 'Apartments', name_ur: 'اپارٹمنٹس اور فلیٹس', icon: '🏢', sort_order: 9, is_active: true },
  { id: 'pcat-10', slug: 'shops', name_en: 'Shops', name_ur: 'دکانیں', icon: '🏪', sort_order: 10, is_active: true },
  { id: 'pcat-11', slug: 'offices', name_en: 'Offices', name_ur: 'دفاتر', icon: '💼', sort_order: 11, is_active: true },
  { id: 'pcat-12', slug: 'buildings', name_en: 'Buildings', name_ur: 'مکمل عمارتیں', icon: '🏛️', sort_order: 12, is_active: true },
  { id: 'pcat-13', slug: 'agricultural-land', name_en: 'Agricultural Land', name_ur: 'زرعی اراضی', icon: '🌾', sort_order: 13, is_active: true },
  { id: 'pcat-14', slug: 'new-projects', name_en: 'New Projects & Developments', name_ur: 'نئے ہاؤسنگ پراجیکٹس', icon: '🌆', sort_order: 14, is_active: true },
  { id: 'pcat-15', slug: 'agent-services', name_en: 'Property Agent Services', name_ur: 'پراپرٹی ایجنٹ سروسز', icon: '🤝', sort_order: 15, is_active: true },
];

// Seeded Verified Properties across Pakistan (Lahore, Islamabad, Karachi)
let mockPropertiesStore: PropertyItem[] = [
  {
    id: 'prop-demo-1',
    owner_id: 'usr-seller-1',
    category_id: 'pcat-8',
    title: 'Brand New 1 Kanal Designer House in DHA Phase 6',
    description: 'Luxurious modern 1 Kanal house with 5 master bedrooms, imported spanish tiles, double height ceiling, swimming pool, servant quarters and solar backup.',
    listing_type: 'for_sale',
    property_type: 'house',
    price: 95000000, // PKR 9.5 Crore
    currency: 'PKR',
    country: 'Pakistan',
    city: 'Lahore',
    area: 'DHA Phase 6',
    society: 'DHA Lahore',
    street_address: 'House 42, Sector B, DHA Phase 6',
    hide_exact_address: false,
    latitude: 31.4697,
    longitude: 74.4424,
    land_size: 1,
    size_unit: 'kanal',
    covered_area: 5500,
    bedrooms: 5,
    bathrooms: 6,
    floors: 2,
    parking_spaces: 3,
    furnishing_status: 'semi_furnished',
    construction_status: 'ready',
    ownership_status: 'freehold',
    is_agent_listing: false,
    verification_status: 'verified',
    documents_reviewed: true,
    verified_listing: true,
    listing_status: 'active',
    featured_until: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    views_count: 1420,
    inquiries_count: 28,
    favourites_count: 45,
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    owner: {
      full_name: 'Haji Tariq Mahmood',
      kyc_status: 'approved',
      is_verified_agent: false,
      seller_rating: 4.9,
    },
    media: [
      { id: 'm-1', property_id: 'prop-demo-1', media_type: 'photo', storage_path: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200', sort_order: 1 },
      { id: 'm-2', property_id: 'prop-demo-1', media_type: 'photo', storage_path: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200', sort_order: 2 },
    ],
  },
  {
    id: 'prop-demo-2',
    owner_id: 'usr-seller-2',
    category_id: 'pcat-9',
    title: 'Luxury 3-Bed High-Rise Apartment in F-10 Islamabad',
    description: 'Corner 3-bedroom apartment on 9th floor with Margalla hills view, dedicated basement parking, high-speed elevators, and round-the-clock security.',
    listing_type: 'for_rent',
    property_type: 'apartment',
    price: 180000, // PKR 1.8 Lakh / Month
    currency: 'PKR',
    country: 'Pakistan',
    city: 'Islamabad',
    area: 'Sector F-10',
    society: 'CDA Islamabad',
    street_address: 'Silver Oaks Towers, F-10',
    hide_exact_address: false,
    latitude: 33.6938,
    longitude: 73.0125,
    land_size: 2400,
    size_unit: 'sq_ft',
    covered_area: 2400,
    bedrooms: 3,
    bathrooms: 4,
    floors: 1,
    parking_spaces: 2,
    furnishing_status: 'furnished',
    construction_status: 'ready',
    ownership_status: 'freehold',
    is_agent_listing: true,
    verification_status: 'verified',
    documents_reviewed: true,
    verified_listing: true,
    listing_status: 'active',
    featured_until: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString(),
    views_count: 890,
    inquiries_count: 19,
    favourites_count: 32,
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    owner: {
      full_name: 'Zeeshan Real Estate Agency',
      kyc_status: 'approved',
      is_verified_agent: true,
      seller_rating: 5.0,
    },
    media: [
      { id: 'm-3', property_id: 'prop-demo-2', media_type: 'photo', storage_path: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200', sort_order: 1 },
    ],
  },
  {
    id: 'prop-demo-3',
    owner_id: 'usr-seller-3',
    category_id: 'pcat-7',
    title: '10 Marla Prime Residential Plot in Bahria Town Sector C',
    description: 'Direct owner 10 Marla plot located on 40ft road, adjacent to park and grand mosque. Possession and utility charges paid.',
    listing_type: 'plot_sale',
    property_type: 'plot_residential',
    price: 18500000, // PKR 1.85 Crore
    currency: 'PKR',
    country: 'Pakistan',
    city: 'Lahore',
    area: 'Bahria Town',
    society: 'Bahria Town Lahore',
    street_address: 'Plot 312, Sector C',
    hide_exact_address: true, // Privacy enabled
    latitude: 31.3685,
    longitude: 74.1812,
    land_size: 10,
    size_unit: 'marla',
    covered_area: null,
    bedrooms: null,
    bathrooms: null,
    floors: null,
    parking_spaces: null,
    furnishing_status: 'unfurnished',
    construction_status: 'ready',
    ownership_status: 'freehold',
    is_agent_listing: false,
    verification_status: 'verified',
    documents_reviewed: true,
    verified_listing: true,
    listing_status: 'active',
    featured_until: null,
    views_count: 610,
    inquiries_count: 14,
    favourites_count: 18,
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    owner: {
      full_name: 'Asad Chaudhry',
      kyc_status: 'approved',
      is_verified_agent: false,
      seller_rating: 4.8,
    },
    media: [
      { id: 'm-4', property_id: 'prop-demo-3', media_type: 'photo', storage_path: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200', sort_order: 1 },
    ],
  },
];

let mockInquiriesStore: PropertyInquiryItem[] = [];
let mockViewingsStore: PropertyViewingItem[] = [];
let mockFavouritesSet: Set<string> = new Set(); // format: `${userId}_${propertyId}`

let mockProjectsStore: PropertyProjectItem[] = [
  {
    id: 'proj-demo-1',
    developer_id: 'dev-1',
    project_name: 'Al-Noor Orchard High-Tech City',
    developer_name: 'Al-Jalil Developers',
    description: 'LDA-approved master planned development featuring smart villas, golf resort, and commercial boulevard.',
    city: 'Lahore',
    location_address: 'Sharaqpur Road, near M-2 Motorway',
    latitude: 31.6025,
    longitude: 74.1205,
    construction_status: 'under_construction',
    total_units: 1200,
    price_from: 3500000,
    price_to: 25000000,
    currency: 'PKR',
    is_verified_project: true,
    featured_until: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    media: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200'],
  },
];

/**
 * 1. Get 15 Real Estate Categories
 */
export async function getPropertyCategories(): Promise<PropertyCategory[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('property_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as PropertyCategory[];
    }
  }
  return INITIAL_PROPERTY_CATEGORIES;
}

/**
 * 2. Get Properties Feed with Rich Filters & Privacy Protection
 */
export async function getPropertiesFeed(
  filters: PropertyFilterOptions = {},
  currentUserId?: string
): Promise<PropertyItem[]> {
  let list = [...mockPropertiesStore];

  if (isSupabaseConfigured) {
    let q = supabase
      .from('properties')
      .select('*, owner:profiles!owner_id(full_name, avatar_url, kyc_status, is_verified_agent, seller_rating), media:property_media(*)')
      .eq('listing_status', 'active');

    if (filters.city) q = q.eq('city', filters.city);
    if (filters.listingType && filters.listingType !== 'all') q = q.eq('listing_type', filters.listingType);
    if (filters.propertyType && filters.propertyType !== 'all') q = q.eq('property_type', filters.propertyType);
    if (filters.minPrice) q = q.gte('price', filters.minPrice);
    if (filters.maxPrice) q = q.lte('price', filters.maxPrice);
    if (filters.verifiedOnly) q = q.eq('verified_listing', true);

    const { data, error } = await q.order('created_at', { ascending: false });
    if (!error && data) {
      list = data as unknown as PropertyItem[];
    }
  }

  // Filter application
  if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
    const query = filters.searchQuery.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query) ||
        p.area.toLowerCase().includes(query) ||
        (p.society && p.society.toLowerCase().includes(query)) ||
        p.description.toLowerCase().includes(query)
    );
  }

  if (filters.city) {
    list = list.filter((p) => p.city.toLowerCase() === filters.city!.toLowerCase());
  }
  if (filters.area) {
    list = list.filter((p) => p.area.toLowerCase().includes(filters.area!.toLowerCase()));
  }
  if (filters.listingType && filters.listingType !== 'all') {
    list = list.filter((p) => p.listing_type === filters.listingType);
  }
  if (filters.propertyType && filters.propertyType !== 'all') {
    list = list.filter((p) => p.property_type === filters.propertyType);
  }
  if (filters.minPrice !== undefined) {
    list = list.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    list = list.filter((p) => p.price <= filters.maxPrice!);
  }
  if (filters.verifiedOnly) {
    list = list.filter((p) => p.verified_listing);
  }
  if (filters.bedrooms !== undefined) {
    list = list.filter((p) => (p.bedrooms || 0) >= filters.bedrooms!);
  }

  // Sorting
  switch (filters.sortBy) {
    case 'price_asc':
      list.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'size_desc':
      list.sort((a, b) => convertToSquareFeet(b.land_size, b.size_unit) - convertToSquareFeet(a.land_size, a.size_unit));
      break;
    case 'popular':
      list.sort((a, b) => b.views_count - a.views_count);
      break;
    case 'newest':
    default:
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
  }

  // Privacy Protection & Favourites check
  return list.map((p) => {
    const isFav = currentUserId ? mockFavouritesSet.has(`${currentUserId}_${p.id}`) : false;
    if (p.hide_exact_address && p.owner_id !== currentUserId) {
      return {
        ...p,
        street_address: undefined, // Hide exact street/house address from public view
        is_favourited: isFav,
      };
    }
    return { ...p, is_favourited: isFav };
  });
}

/**
 * 3. Get Single Property by ID
 */
export async function getPropertyById(
  propertyId: string,
  currentUserId?: string
): Promise<PropertyItem | null> {
  const list = await getPropertiesFeed({}, currentUserId);
  const found = list.find((p) => p.id === propertyId);
  return found || null;
}

/**
 * 4. Create Property Listing
 */
export async function createPropertyListing(
  ownerId: string,
  input: PropertyCreationInput
): Promise<PropertyItem> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('create_property_listing', {
      p_title: input.title,
      p_description: input.description,
      p_listing_type: input.listingType,
      p_property_type: input.propertyType,
      p_price: input.price,
      p_currency: input.currency || 'PKR',
      p_city: input.city,
      p_area: input.area,
      p_society: input.society || null,
      p_street_address: input.streetAddress || null,
      p_hide_exact_address: input.hideExactAddress || false,
      p_latitude: input.latitude || null,
      p_longitude: input.longitude || null,
      p_land_size: input.landSize,
      p_size_unit: input.sizeUnit,
      p_covered_area: input.coveredArea || null,
      p_bedrooms: input.bedrooms || null,
      p_bathrooms: input.bathrooms || null,
      p_floors: input.floors || null,
      p_parking_spaces: input.parkingSpaces || null,
      p_furnishing_status: input.furnishingStatus || 'unfurnished',
      p_construction_status: input.constructionStatus || 'ready',
      p_ownership_status: input.ownershipStatus || 'freehold',
      p_is_agent_listing: input.isAgentListing || false,
      p_media_paths: input.mediaPaths || [],
      p_document_paths: input.documentPaths || [],
    });

    if (error) throw new Error(error.message);
    const created = await getPropertyById(String(data), ownerId);
    if (created) return created;
  }

  const newProp: PropertyItem = {
    id: `prop-${Date.now()}`,
    owner_id: ownerId,
    title: input.title,
    description: input.description,
    listing_type: input.listingType,
    property_type: input.propertyType,
    price: input.price,
    currency: input.currency || 'PKR',
    country: input.country || 'Pakistan',
    city: input.city,
    area: input.area,
    society: input.society || null,
    street_address: input.streetAddress || null,
    hide_exact_address: input.hideExactAddress || false,
    latitude: input.latitude || null,
    longitude: input.longitude || null,
    land_size: input.landSize,
    size_unit: input.sizeUnit || 'marla',
    covered_area: input.coveredArea || null,
    bedrooms: input.bedrooms || null,
    bathrooms: input.bathrooms || null,
    floors: input.floors || null,
    parking_spaces: input.parkingSpaces || null,
    furnishing_status: input.furnishingStatus || 'unfurnished',
    construction_status: input.constructionStatus || 'ready',
    ownership_status: input.ownershipStatus || 'freehold',
    is_agent_listing: input.isAgentListing || false,
    verification_status: 'pending_review',
    documents_reviewed: (input.documentPaths?.length ?? 0) > 0,
    verified_listing: false,
    listing_status: 'active',
    views_count: 0,
    inquiries_count: 0,
    favourites_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner: {
      full_name: 'Verified Owner',
      kyc_status: 'approved',
      is_verified_agent: input.isAgentListing || false,
      seller_rating: 5.0,
    },
    media: (input.mediaPaths || []).map((p, idx) => ({
      id: `m-${Date.now()}-${idx}`,
      property_id: `prop-${Date.now()}`,
      media_type: 'photo',
      storage_path: p,
      sort_order: idx + 1,
    })),
  };

  mockPropertiesStore.unshift(newProp);
  return newProp;
}

/**
 * 5. Admin Review & 3-Tier Verification Approval
 */
export async function adminReviewProperty(
  propertyId: string,
  newVerificationStatus: PropertyVerificationStatus,
  documentsReviewed: boolean = true
): Promise<boolean> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('admin_review_property', {
      p_property_id: propertyId,
      p_verification_status: newVerificationStatus,
      p_documents_reviewed: documentsReviewed,
    });
    if (error) throw new Error(error.message);
    return Boolean(data);
  }

  const prop = mockPropertiesStore.find((p) => p.id === propertyId);
  if (!prop) throw new Error('Property not found');

  prop.verification_status = newVerificationStatus;
  prop.documents_reviewed = documentsReviewed;
  prop.verified_listing = newVerificationStatus === 'verified';
  prop.updated_at = new Date().toISOString();

  return true;
}

/**
 * 6. Toggle Favourite
 */
export async function togglePropertyFavourite(
  propertyId: string,
  userId: string
): Promise<boolean> {
  const key = `${userId}_${propertyId}`;
  const isFav = mockFavouritesSet.has(key);

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('toggle_property_favourite', {
      p_property_id: propertyId,
    });
    if (!error) return Boolean(data);
  }

  const prop = mockPropertiesStore.find((p) => p.id === propertyId);

  if (isFav) {
    mockFavouritesSet.delete(key);
    if (prop) prop.favourites_count = Math.max(0, prop.favourites_count - 1);
    return false;
  } else {
    mockFavouritesSet.add(key);
    if (prop) prop.favourites_count += 1;
    return true;
  }
}

/**
 * 7. Create Buyer Inquiry or Offer (Hooks into shared Chat)
 */
export async function createPropertyInquiry(
  propertyId: string,
  buyerId: string,
  message: string,
  offerPrice?: number | null
): Promise<PropertyInquiryItem> {
  const prop = mockPropertiesStore.find((p) => p.id === propertyId);
  if (!prop) throw new Error('Property not found');
  if (prop.owner_id === buyerId) throw new Error('Cannot inquire on your own property');

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('create_property_inquiry', {
      p_property_id: propertyId,
      p_message: message,
      p_offer_price: offerPrice || null,
    });
    if (error) throw new Error(error.message);
  }

  prop.inquiries_count += 1;

  const inq: PropertyInquiryItem = {
    id: `inq-${Date.now()}`,
    property_id: propertyId,
    buyer_id: buyerId,
    seller_id: prop.owner_id,
    message,
    offer_price: offerPrice,
    status: offerPrice ? 'offer_submitted' : 'new',
    created_at: new Date().toISOString(),
    property: prop,
  };

  mockInquiriesStore.unshift(inq);
  return inq;
}

/**
 * 8. Schedule Property Viewing Appointment
 */
export async function schedulePropertyViewing(
  propertyId: string,
  buyerId: string,
  scheduledAt: string,
  inquiryId?: string | null,
  notes?: string | null
): Promise<PropertyViewingItem> {
  const prop = mockPropertiesStore.find((p) => p.id === propertyId);
  if (!prop) throw new Error('Property not found');

  if (new Date(scheduledAt).getTime() <= Date.now()) {
    throw new Error('Viewing appointment must be in the future');
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('schedule_property_viewing', {
      p_property_id: propertyId,
      p_inquiry_id: inquiryId || null,
      p_scheduled_at: scheduledAt,
      p_notes: notes || null,
    });
    if (error) throw new Error(error.message);
  }

  const viewing: PropertyViewingItem = {
    id: `view-${Date.now()}`,
    property_id: propertyId,
    inquiry_id: inquiryId,
    buyer_id: buyerId,
    seller_id: prop.owner_id,
    scheduled_at: scheduledAt,
    status: 'pending',
    notes,
    created_at: new Date().toISOString(),
    property: prop,
  };

  mockViewingsStore.unshift(viewing);
  return viewing;
}

/**
 * 9. Side-by-Side Comparison of up to 4 Properties
 */
export async function compareProperties(propertyIds: string[]): Promise<PropertyItem[]> {
  if (propertyIds.length > 4) {
    throw new Error('Comparison limit is maximum 4 properties');
  }
  const all = await getPropertiesFeed();
  return all.filter((p) => propertyIds.includes(p.id));
}

/**
 * 10. Get New Housing Projects & Developments
 */
export async function getPropertyProjects(): Promise<PropertyProjectItem[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('property_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as PropertyProjectItem[];
    }
  }
  return mockProjectsStore;
}

/**
 * 11. Buyer Operations: Inquiries & Viewings
 */
export async function getBuyerInquiries(buyerId: string): Promise<PropertyInquiryItem[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('property_inquiries')
      .select('*, property:properties(*)')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (!error && data) return data as PropertyInquiryItem[];
  }
  return mockInquiriesStore.filter((inq) => inq.buyer_id === buyerId);
}

export async function getBuyerViewings(buyerId: string): Promise<PropertyViewingItem[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('property_viewings')
      .select('*, property:properties(*)')
      .eq('buyer_id', buyerId)
      .order('scheduled_at', { ascending: true });

    if (!error && data) return data as PropertyViewingItem[];
  }
  return mockViewingsStore.filter((v) => v.buyer_id === buyerId);
}

/**
 * 12. Seller Operations: Listings, Inquiries & Viewing Requests
 */
export async function getSellerProperties(sellerId: string): Promise<PropertyItem[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('properties')
      .select('*, media:property_media(*)')
      .eq('owner_id', sellerId)
      .order('created_at', { ascending: false });

    if (!error && data) return data as PropertyItem[];
  }
  return mockPropertiesStore.filter((p) => p.owner_id === sellerId);
}

export async function getSellerInquiries(sellerId: string): Promise<PropertyInquiryItem[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('property_inquiries')
      .select('*, property:properties(*), buyer:profiles!buyer_id(full_name, avatar_url, phone)')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (!error && data) return data as PropertyInquiryItem[];
  }
  return mockInquiriesStore.filter((inq) => inq.seller_id === sellerId);
}

export async function getSellerViewings(sellerId: string): Promise<PropertyViewingItem[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('property_viewings')
      .select('*, property:properties(*), buyer:profiles!buyer_id(full_name, avatar_url, phone)')
      .eq('seller_id', sellerId)
      .order('scheduled_at', { ascending: true });

    if (!error && data) return data as PropertyViewingItem[];
  }
  return mockViewingsStore.filter((v) => v.seller_id === sellerId);
}

export async function updateViewingStatus(
  viewingId: string,
  newStatus: ViewingAppointmentStatus,
  rescheduledAt?: string
): Promise<PropertyViewingItem> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('property_viewings')
      .update({
        status: newStatus,
        scheduled_at: rescheduledAt || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', viewingId)
      .select('*, property:properties(*)')
      .single();

    if (!error && data) return data as PropertyViewingItem;
  }

  const viewing = mockViewingsStore.find((v) => v.id === viewingId);
  if (!viewing) throw new Error('Viewing appointment not found');
  viewing.status = newStatus;
  if (rescheduledAt) {
    viewing.scheduled_at = rescheduledAt;
  }
  return viewing;
}

export async function respondToInquiry(
  inquiryId: string,
  newStatus: PropertyInquiryStatus,
  counterPrice?: number
): Promise<PropertyInquiryItem> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('property_inquiries')
      .update({
        status: newStatus,
        offer_price: counterPrice !== undefined ? counterPrice : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inquiryId)
      .select('*, property:properties(*)')
      .single();

    if (!error && data) return data as PropertyInquiryItem;
  }

  const inquiry = mockInquiriesStore.find((i) => i.id === inquiryId);
  if (!inquiry) throw new Error('Inquiry not found');
  inquiry.status = newStatus;
  if (counterPrice !== undefined) {
    inquiry.offer_price = counterPrice;
  }
  return inquiry;
}

export async function getSellerAnalytics(sellerId: string): Promise<{
  totalListings: number;
  activeListings: number;
  totalViews: number;
  totalInquiries: number;
  totalViewings: number;
}> {
  const properties = await getSellerProperties(sellerId);
  const inquiries = await getSellerInquiries(sellerId);
  const viewings = await getSellerViewings(sellerId);

  return {
    totalListings: properties.length,
    activeListings: properties.filter((p) => p.listing_status === 'active').length,
    totalViews: properties.reduce((acc, p) => acc + (p.views_count || 0), 0),
    totalInquiries: inquiries.length,
    totalViewings: viewings.length,
  };
}

export function __resetRealEstateStore() {
  mockPropertiesStore = mockPropertiesStore.map((p) => ({ ...p, verification_status: 'verified', verified_listing: true }));
  mockInquiriesStore = [];
  mockViewingsStore = [];
  mockFavouritesSet = new Set();
}
