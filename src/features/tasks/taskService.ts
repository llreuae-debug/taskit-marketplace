import { supabase, isSupabaseConfigured } from '../../services/supabase';
import {
  TaskCategory,
  TaskItem,
  TaskOffer,
  TaskFilterOptions,
} from '../../types/tasks';
import {
  CompleteTaskCreationInput,
  calculateDistanceKm,
} from './validation';
import { calculateTaskFeeBreakdown } from '../../utils/formatters';

// 14 Initial Built-in Task Categories (Offline / Seed Fallback)
export const INITIAL_CATEGORIES: TaskCategory[] = [
  { id: 'cat-1', slug: 'car-parts-finder', name_en: 'Car Parts Finder', name_ur: 'کار پارٹس فائنڈر', icon: '🔧', sort_order: 1, is_active: true, custom_fields: [{ name: 'vehicle_model', type: 'text', label: 'Vehicle Make & Model', required: true }] },
  { id: 'cat-2', slug: 'delivery-courier', name_en: 'Delivery / Courier', name_ur: 'ڈلیوری / کوریئر', icon: '📦', sort_order: 2, is_active: true, custom_fields: [{ name: 'package_size', type: 'select', label: 'Package Size', options: ['Small', 'Medium', 'Large'], required: true }] },
  { id: 'cat-3', slug: 'grocery-shopping', name_en: 'Grocery & Shopping', name_ur: 'گروسری اور خریداری', icon: '🛒', sort_order: 3, is_active: true, custom_fields: [] },
  { id: 'cat-4', slug: 'pharmacy-pickup', name_en: 'Pharmacy Pickup', name_ur: 'فارمیسی سے ادویات', icon: '💊', sort_order: 4, is_active: true, custom_fields: [{ name: 'prescription_required', type: 'boolean', label: 'Prescription Needed', required: true }] },
  { id: 'cat-5', slug: 'documents-banking', name_en: 'Documents & Banking', name_ur: 'دستاویزات اور بینکنگ', icon: '🏦', sort_order: 5, is_active: true, custom_fields: [] },
  { id: 'cat-6', slug: 'queue-line-standing', name_en: 'Queue / Line Standing', name_ur: 'قطار میں کھڑے ہونا', icon: '⏳', sort_order: 6, is_active: true, custom_fields: [] },
  { id: 'cat-7', slug: 'repairs-handyman', name_en: 'Repairs & Handyman', name_ur: 'مرمت اور ہینڈی مین', icon: '🛠️', sort_order: 7, is_active: true, custom_fields: [] },
  { id: 'cat-8', slug: 'cleaning', name_en: 'Cleaning', name_ur: 'صفائی کی سروس', icon: '🧹', sort_order: 8, is_active: true, custom_fields: [] },
  { id: 'cat-9', slug: 'moving-lifting', name_en: 'Moving & Lifting', name_ur: 'سامان کی منتقلی', icon: '🚚', sort_order: 9, is_active: true, custom_fields: [] },
  { id: 'cat-10', slug: 'pet-care', name_en: 'Pet Care', name_ur: 'پالتو جانوروں کی دیکھ بھال', icon: '🐾', sort_order: 10, is_active: true, custom_fields: [] },
  { id: 'cat-11', slug: 'online-digital', name_en: 'Online / Digital Tasks', name_ur: 'آن لائن اور ڈیجیٹل سروسز', icon: '💻', sort_order: 11, is_active: true, custom_fields: [] },
  { id: 'cat-12', slug: 'photography-video', name_en: 'Photography & Video', name_ur: 'فوٹوگرافی اور ویڈیو', icon: '📸', sort_order: 12, is_active: true, custom_fields: [] },
  { id: 'cat-13', slug: 'gifts-surprises', name_en: 'Gifts & Surprises', name_ur: 'تحائف اور سرپرائز', icon: '🎁', sort_order: 13, is_active: true, custom_fields: [] },
  { id: 'cat-14', slug: 'anything-else', name_en: 'Anything Else', name_ur: 'کوئی اور کام', icon: '⚡', sort_order: 14, is_active: true, custom_fields: [] },
];

// Initial Demo Tasks in Lahore / Islamabad / Karachi
let mockTasksStore: TaskItem[] = [
  {
    id: 'task-demo-1',
    poster_id: 'poster-1',
    tasker_id: null,
    category_id: 'cat-1',
    title: 'Find Honda Civic 2018 Side Mirror in Montgomery Road',
    description: 'Need original right-side motorized mirror for Honda Civic 2018. Must inspect condition, take photos for approval, purchase and deliver to DHA Phase 5.',
    photos: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800'],
    location_type: 'physical_pickup_dropoff',
    pickup_name: 'Montgomery Road Auto Market',
    pickup_address: 'Montgomery Road, Lahore',
    pickup_latitude: 31.5546,
    pickup_longitude: 74.3214,
    dropoff_name: 'DHA Phase 5 Resident',
    dropoff_address: 'Sector C, DHA Phase 5, Lahore',
    dropoff_latitude: 31.4697,
    dropoff_longitude: 74.4424,
    latitude: 31.5546,
    longitude: 74.3214,
    currency: 'PKR',
    task_charges: 1500,
    expense_budget: 12000,
    service_fee: 150,
    tasker_amount: 1350,
    deadline: new Date(Date.now() + 8 * 3600 * 1000).toISOString(), // 8 hours from now
    acceptance_method: 'both',
    status: 'open',
    custom_data: { vehicle_model: 'Honda Civic 2018' },
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    poster: {
      full_name: 'Usman Tariq',
      kyc_status: 'approved',
      poster_rating: 4.9,
    },
    category: INITIAL_CATEGORIES[0],
  },
  {
    id: 'task-demo-2',
    poster_id: 'poster-2',
    tasker_id: null,
    category_id: 'cat-2',
    title: 'Urgent Urgent Document Delivery to F-7 Islamabad',
    description: 'Collect signed property agreement folder from Blue Area and deliver to buyer in F-7/2 within 2 hours.',
    photos: [],
    location_type: 'physical_pickup_dropoff',
    pickup_name: 'ISE Towers Blue Area',
    pickup_address: 'Blue Area, Islamabad',
    pickup_latitude: 33.7128,
    pickup_longitude: 73.0601,
    dropoff_name: 'Sector F-7/2 Residence',
    dropoff_address: 'Street 14, F-7/2, Islamabad',
    dropoff_latitude: 33.7208,
    dropoff_longitude: 73.0561,
    latitude: 33.7128,
    longitude: 73.0601,
    currency: 'PKR',
    task_charges: 1000,
    expense_budget: 0,
    service_fee: 100,
    tasker_amount: 900,
    deadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    acceptance_method: 'instant',
    status: 'open',
    custom_data: { package_size: 'Small' },
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    poster: {
      full_name: 'Fatima Zahra',
      kyc_status: 'approved',
      poster_rating: 5.0,
    },
    category: INITIAL_CATEGORIES[1],
  },
  {
    id: 'task-demo-3',
    poster_id: 'poster-3',
    tasker_id: null,
    category_id: 'cat-7',
    title: 'AC Gas Leak Check & Filter Cleaning in Clifton',
    description: 'Inverter AC not cooling properly. Need professional AC technician to inspect gas pressure, fix leaks, and clean indoor and outdoor units.',
    photos: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800'],
    location_type: 'physical_single',
    location_name: 'Block 4 Clifton Apartment',
    location_address: 'Block 4, Clifton, Karachi',
    latitude: 24.8238,
    longitude: 67.0315,
    currency: 'PKR',
    task_charges: 2500,
    expense_budget: 3000,
    service_fee: 250,
    tasker_amount: 2250,
    deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    acceptance_method: 'both',
    status: 'open',
    custom_data: {},
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    poster: {
      full_name: 'Bilal Farooq',
      kyc_status: 'approved',
      poster_rating: 4.8,
    },
    category: INITIAL_CATEGORIES[6],
  },
];

let mockOffersStore: TaskOffer[] = [];

/**
 * Fetch all active task categories
 */
export async function getTaskCategories(): Promise<TaskCategory[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as TaskCategory[];
    }
  }
  return INITIAL_CATEGORIES;
}

/**
 * Filter & Search Task Feed with Geospatial Distance & Sorting
 */
export async function getTasksFeed(filters: TaskFilterOptions = {}): Promise<TaskItem[]> {
  let tasks = [...mockTasksStore];

  if (isSupabaseConfigured) {
    let query = supabase
      .from('tasks')
      .select('*, poster:profiles!poster_id(full_name, avatar_url, kyc_status, poster_rating), category:categories!category_id(*)')
      .eq('status', 'open');

    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters.minPrice) {
      query = query.gte('task_charges', filters.minPrice);
    }
    if (filters.maxPrice) {
      query = query.lte('task_charges', filters.maxPrice);
    }
    if (filters.locationType && filters.locationType !== 'all') {
      query = query.eq('location_type', filters.locationType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) {
      tasks = data as unknown as TaskItem[];
    }
  }

  // Client-side text search
  if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
    const q = filters.searchQuery.toLowerCase();
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.location_address && t.location_address.toLowerCase().includes(q))
    );
  }

  // Category filter
  if (filters.categoryId) {
    tasks = tasks.filter((t) => t.category_id === filters.categoryId);
  }

  // Price range filters
  if (filters.minPrice !== undefined) {
    tasks = tasks.filter((t) => t.task_charges >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    tasks = tasks.filter((t) => t.task_charges <= filters.maxPrice!);
  }

  // Location type filter
  if (filters.locationType && filters.locationType !== 'all') {
    tasks = tasks.filter((t) => t.location_type === filters.locationType);
  }

  // Compute Distance if user coords provided
  if (filters.userCoords) {
    tasks = tasks.map((t) => {
      if (t.latitude && t.longitude && filters.userCoords) {
        const dist = calculateDistanceKm(
          filters.userCoords.latitude,
          filters.userCoords.longitude,
          t.latitude,
          t.longitude
        );
        return { ...t, distance_km: dist };
      }
      return t;
    });

    if (filters.maxDistanceKm) {
      tasks = tasks.filter(
        (t) => t.distance_km !== undefined && t.distance_km <= filters.maxDistanceKm!
      );
    }
  }

  // Sorting
  switch (filters.sortBy) {
    case 'price_asc':
      tasks.sort((a, b) => a.task_charges - b.task_charges);
      break;
    case 'price_desc':
      tasks.sort((a, b) => b.task_charges - a.task_charges);
      break;
    case 'deadline':
      tasks.sort(
        (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      );
      break;
    case 'distance':
      tasks.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
      break;
    case 'newest':
    default:
      tasks.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      break;
  }

  return tasks;
}

/**
 * Fetch a single task by ID
 */
export async function getTaskById(taskId: string): Promise<TaskItem | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, poster:profiles!poster_id(full_name, avatar_url, kyc_status, poster_rating), category:categories!category_id(*)')
      .eq('id', taskId)
      .single();

    if (!error && data) {
      return data as unknown as TaskItem;
    }
  }

  const found = mockTasksStore.find((t) => t.id === taskId);
  return found || null;
}

/**
 * Create a new task (Post a Task Flow)
 */
export async function createNewTask(
  posterId: string,
  input: CompleteTaskCreationInput
): Promise<TaskItem> {
  const breakdown = calculateTaskFeeBreakdown(input.taskCharges, 10);

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('create_task', {
      p_category_id: input.categoryId,
      p_title: input.title,
      p_description: input.description,
      p_voice_note_path: input.voiceNotePath || null,
      p_photos: input.photos || [],
      p_location_type: input.locationType,
      p_location_name: input.locationName || null,
      p_location_address: input.locationAddress || null,
      p_latitude: input.latitude || null,
      p_longitude: input.longitude || null,
      p_pickup_name: input.pickupName || null,
      p_pickup_address: input.pickupAddress || null,
      p_pickup_latitude: input.pickupLatitude || null,
      p_pickup_longitude: input.pickupLongitude || null,
      p_dropoff_name: input.dropoffName || null,
      p_dropoff_address: input.dropoffAddress || null,
      p_dropoff_latitude: input.dropoffLatitude || null,
      p_dropoff_longitude: input.dropoffLongitude || null,
      p_currency: input.currency || 'PKR',
      p_task_charges: input.taskCharges,
      p_expense_budget: input.expenseBudget || 0,
      p_deadline: input.deadline,
      p_acceptance_method: input.acceptanceMethod,
      p_custom_data: input.customData || {},
    });

    if (error) {
      throw new Error(error.message);
    }

    const created = await getTaskById(String(data));
    if (created) return created;
  }

  // Mock Store Fallback
  const category = INITIAL_CATEGORIES.find((c) => c.id === input.categoryId) || INITIAL_CATEGORIES[13];
  const newTask: TaskItem = {
    id: `task-${Date.now()}`,
    poster_id: posterId,
    tasker_id: null,
    category_id: input.categoryId,
    title: input.title,
    description: input.description,
    voice_note_path: input.voiceNotePath,
    photos: input.photos || [],
    location_type: input.locationType,
    location_name: input.locationName,
    location_address: input.locationAddress,
    latitude: input.latitude,
    longitude: input.longitude,
    pickup_name: input.pickupName,
    pickup_address: input.pickupAddress,
    pickup_latitude: input.pickupLatitude,
    pickup_longitude: input.pickupLongitude,
    dropoff_name: input.dropoffName,
    dropoff_address: input.dropoffAddress,
    dropoff_latitude: input.dropoffLatitude,
    dropoff_longitude: input.dropoffLongitude,
    currency: input.currency || 'PKR',
    task_charges: breakdown.taskCharges,
    expense_budget: input.expenseBudget || 0,
    service_fee: breakdown.serviceFee,
    tasker_amount: breakdown.taskerReceives,
    deadline: input.deadline,
    acceptance_method: input.acceptanceMethod || 'instant',
    status: 'open',
    custom_data: input.customData || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    poster: {
      full_name: 'Verified Poster',
      kyc_status: 'approved',
      poster_rating: 5.0,
    },
    category,
  };

  mockTasksStore.unshift(newTask);
  return newTask;
}

/**
 * ATOMIC TASK ACCEPTANCE
 * Row-locking atomic acceptance guarantee: only ONE tasker can accept an open task.
 */
export async function acceptTaskAtomic(
  taskId: string,
  taskerId: string
): Promise<{ success: boolean; task_id: string; status: string; completion_code?: string }> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('accept_task', {
      p_task_id: taskId,
    });

    if (error) {
      throw new Error(error.message);
    }
    return data as { success: boolean; task_id: string; status: string };
  }

  // Atomic simulation with in-memory lock
  const taskIndex = mockTasksStore.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    throw new Error('Task not found');
  }

  const currentTask = mockTasksStore[taskIndex];
  if (currentTask.status !== 'open') {
    throw new Error(
      `Task is no longer open for acceptance. Current status: ${currentTask.status}`
    );
  }

  if (currentTask.poster_id === taskerId) {
    throw new Error('Posters cannot accept their own tasks');
  }

  const completionCode = Math.floor(1000 + Math.random() * 9000).toString();
  const updatedTask: TaskItem = {
    ...currentTask,
    tasker_id: taskerId,
    status: 'accepted',
    accepted_at: new Date().toISOString(),
    completion_code: completionCode,
    updated_at: new Date().toISOString(),
  };

  mockTasksStore[taskIndex] = updatedTask;

  return {
    success: true,
    task_id: taskId,
    status: 'accepted',
    completion_code: completionCode,
  };
}

/**
 * Submit Counter-Price / Offer on a task
 */
export async function submitTaskOffer(
  taskId: string,
  taskerId: string,
  offeredPrice: number,
  comment?: string
): Promise<TaskOffer> {
  const newOffer: TaskOffer = {
    id: `offer-${Date.now()}`,
    task_id: taskId,
    tasker_id: taskerId,
    offered_price: offeredPrice,
    comment,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  mockOffersStore.push(newOffer);
  return newOffer;
}

/**
 * Reset mock store (useful for clean unit test state)
 */
export function __resetMockStore() {
  mockTasksStore = mockTasksStore.map((t) => ({ ...t, status: 'open', tasker_id: null }));
  mockOffersStore = [];
}
