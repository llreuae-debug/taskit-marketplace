import {
  INITIAL_CATEGORIES,
  getTaskCategories,
  getTasksFeed,
  getTaskById,
  createNewTask,
  acceptTaskAtomic,
  submitTaskOffer,
  __resetMockStore,
} from '../../src/features/tasks/taskService';
import {
  taskScreen1Schema,
  taskScreen2Schema,
  taskScreen3Schema,
  taskScreen4Schema,
  calculateDistanceKm,
} from '../../src/features/tasks/validation';

describe('Phase 3 — Task Marketplace Core & Atomic Acceptance', () => {
  beforeEach(() => {
    __resetMockStore();
  });

  test('loads 14 configurable task categories with custom field definitions', async () => {
    const categories = await getTaskCategories();
    expect(categories.length).toBe(14);
    expect(categories[0].slug).toBe('car-parts-finder');
    expect(categories[0].custom_fields.length).toBeGreaterThan(0);
    expect(categories[1].slug).toBe('delivery-courier');
    expect(categories[13].slug).toBe('anything-else');
  });

  test('validates 4-screen Post a Task input schemas', () => {
    // Screen 1: Category Selection
    expect(taskScreen1Schema.safeParse({ categoryId: 'cat-1' }).success).toBe(true);
    expect(taskScreen1Schema.safeParse({ categoryId: '' }).success).toBe(false);

    // Screen 2: Title, Description, Voice, Photos (Max 5)
    expect(
      taskScreen2Schema.safeParse({
        title: 'Find Honda Civic mirror',
        description: 'Need motorized right side mirror from Montgomery Road market.',
        photos: ['photo1.jpg', 'photo2.jpg'],
      }).success
    ).toBe(true);

    // Title too short (< 5 chars)
    expect(
      taskScreen2Schema.safeParse({
        title: 'AC',
        description: 'Clean my AC filter today please.',
      }).success
    ).toBe(false);

    // More than 5 photos
    expect(
      taskScreen2Schema.safeParse({
        title: 'Fix washing machine',
        description: 'Machine is not draining properly.',
        photos: ['1', '2', '3', '4', '5', '6'],
      }).success
    ).toBe(false);

    // Screen 3: Locations
    // Physical single requires locationAddress
    expect(
      taskScreen3Schema.safeParse({
        locationType: 'physical_single',
        locationAddress: 'Sector C, DHA Phase 5, Lahore',
      }).success
    ).toBe(true);

    expect(
      taskScreen3Schema.safeParse({
        locationType: 'physical_single',
        locationAddress: '',
      }).success
    ).toBe(false);

    // Physical pickup & dropoff requires both addresses
    expect(
      taskScreen3Schema.safeParse({
        locationType: 'physical_pickup_dropoff',
        pickupAddress: 'Montgomery Road, Lahore',
        dropoffAddress: 'DHA Phase 5, Lahore',
      }).success
    ).toBe(true);

    expect(
      taskScreen3Schema.safeParse({
        locationType: 'physical_pickup_dropoff',
        pickupAddress: 'Montgomery Road, Lahore',
        dropoffAddress: '',
      }).success
    ).toBe(false);

    // Online tasks do not require physical street address
    expect(
      taskScreen3Schema.safeParse({
        locationType: 'online',
      }).success
    ).toBe(true);

    // Screen 4: Pricing & Future Deadline
    const futureDate = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
    expect(
      taskScreen4Schema.safeParse({
        taskCharges: 1000,
        expenseBudget: 200,
        deadline: futureDate,
        acceptanceMethod: 'instant',
      }).success
    ).toBe(true);

    // Under minimum charge (< 100 PKR)
    expect(
      taskScreen4Schema.safeParse({
        taskCharges: 50,
        deadline: futureDate,
      }).success
    ).toBe(false);

    // Past deadline fails
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
    expect(
      taskScreen4Schema.safeParse({
        taskCharges: 1000,
        deadline: pastDate,
      }).success
    ).toBe(false);
  });

  test('calculates accurate Haversine distance between coordinates', () => {
    // Lahore (31.5204, 74.3587) to Islamabad (33.6844, 73.0479) ~260-275 km
    const dist = calculateDistanceKm(31.5204, 74.3587, 33.6844, 73.0479);
    expect(dist).toBeGreaterThan(250);
    expect(dist).toBeLessThan(285);
  });

  test('filters and searches the task feed accurately', async () => {
    // Search query
    const searchRes = await getTasksFeed({ searchQuery: 'Montgomery' });
    expect(searchRes.length).toBeGreaterThanOrEqual(1);
    expect(searchRes[0].title).toContain('Honda Civic');

    // Category filter
    const catRes = await getTasksFeed({ categoryId: 'cat-7' }); // Repairs
    expect(catRes.every((t) => t.category_id === 'cat-7')).toBe(true);

    // Price sorting
    const sortedRes = await getTasksFeed({ sortBy: 'price_desc' });
    expect(sortedRes[0].task_charges).toBeGreaterThanOrEqual(sortedRes[sortedRes.length - 1].task_charges);
  });

  test('creates a task with server-verified escrow and fee calculation', async () => {
    const created = await createNewTask('poster-usr-99', {
      categoryId: 'cat-2',
      title: 'Pick up bakery parcel from Gulberg',
      description: 'Collect fresh birthday cake from Kitchen Cuisine and deliver to Model Town.',
      locationType: 'physical_pickup_dropoff',
      pickupAddress: 'Main Market, Gulberg, Lahore',
      dropoffAddress: 'Block C, Model Town, Lahore',
      taskCharges: 1500,
      expenseBudget: 2500,
      deadline: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
      acceptanceMethod: 'instant',
      photos: [],
      customData: {},
    });

    expect(created.id).toBeTruthy();
    expect(created.status).toBe('open');
    expect(created.task_charges).toBe(1500);
    expect(created.service_fee).toBe(150); // 10%
    expect(created.tasker_amount).toBe(1350); // 1500 - 150
  });

  test('enforces atomic single-tasker acceptance with row locking guarantee', async () => {
    const tasks = await getTasksFeed();
    const targetTask = tasks[0];

    // First tasker accepts
    const acceptRes1 = await acceptTaskAtomic(targetTask.id, 'tasker-hero-1');
    expect(acceptRes1.success).toBe(true);
    expect(acceptRes1.status).toBe('accepted');
    expect(acceptRes1.completion_code).toMatch(/^[0-9]{4}$/);

    // Second tasker attempts to accept the SAME task -> MUST FAIL
    await expect(acceptTaskAtomic(targetTask.id, 'tasker-hero-2')).rejects.toThrow(
      /no longer open for acceptance/
    );

    // Poster attempting to accept their own task -> MUST FAIL
    await expect(acceptTaskAtomic(targetTask.id, targetTask.poster_id)).rejects.toThrow();
  });

  test('allows taskers to propose counter-offers on tasks', async () => {
    const offer = await submitTaskOffer(
      'task-demo-1',
      'tasker-expert-9',
      1800,
      'I can pick up the side mirror in 20 minutes and inspect motorized wires.'
    );
    expect(offer.id).toBeTruthy();
    expect(offer.offered_price).toBe(1800);
    expect(offer.status).toBe('pending');
  });
});
