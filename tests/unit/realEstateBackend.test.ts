import {
  getPropertyCategories,
  getPropertiesFeed,
  getPropertyById,
  createPropertyListing,
  adminReviewProperty,
  togglePropertyFavourite,
  createPropertyInquiry,
  schedulePropertyViewing,
  compareProperties,
  getPropertyProjects,
  __resetRealEstateStore,
} from '../../src/features/realEstate/realEstateService';
import {
  propertyCreationSchema,
  propertyInquirySchema,
  propertyViewingSchema,
  convertToSquareFeet,
  isResidentialStructure,
} from '../../src/features/realEstate/validation';

describe('Phase 6 — Real Estate Backend, 3-Tier Verification & Queries', () => {
  beforeEach(() => {
    __resetRealEstateStore();
  });

  test('loads 15 standard real estate categories with multilingual support', async () => {
    const categories = await getPropertyCategories();
    expect(categories).toHaveLength(15);
    expect(categories[0].slug).toBe('buy-property');
    expect(categories[4].slug).toBe('residential');
    expect(categories[6].slug).toBe('plots-land');
    expect(categories[13].slug).toBe('new-projects');
  });

  test('validates conditional fields (bedrooms required for houses, exempt for plots/land)', () => {
    expect(isResidentialStructure('house')).toBe(true);
    expect(isResidentialStructure('apartment')).toBe(true);
    expect(isResidentialStructure('plot_residential')).toBe(false);
    expect(isResidentialStructure('agricultural_land')).toBe(false);

    // House missing bedrooms fails validation
    expect(
      propertyCreationSchema.safeParse({
        title: '5 Marla Double Storey House',
        description: 'Newly constructed house in Johar Town Lahore with parking.',
        listingType: 'for_sale',
        propertyType: 'house',
        price: 15000000,
        city: 'Lahore',
        area: 'Johar Town',
        landSize: 5,
        sizeUnit: 'marla',
        bedrooms: undefined, // Missing!
      }).success
    ).toBe(false);

    // House with bedrooms succeeds
    expect(
      propertyCreationSchema.safeParse({
        title: '5 Marla Double Storey House',
        description: 'Newly constructed house in Johar Town Lahore with parking.',
        listingType: 'for_sale',
        propertyType: 'house',
        price: 15000000,
        city: 'Lahore',
        area: 'Johar Town',
        landSize: 5,
        sizeUnit: 'marla',
        bedrooms: 3,
        bathrooms: 3,
      }).success
    ).toBe(true);

    // Plot does NOT require bedrooms/bathrooms
    expect(
      propertyCreationSchema.safeParse({
        title: '1 Kanal Residential Plot in Sector C',
        description: 'Direct owner corner plot facing grand park.',
        listingType: 'plot_sale',
        propertyType: 'plot_residential',
        price: 25000000,
        city: 'Lahore',
        area: 'DHA Phase 6',
        landSize: 1,
        sizeUnit: 'kanal',
      }).success
    ).toBe(true);
  });

  test('converts Pakistani and international land units to square feet', () => {
    // 1 Marla = 225 sq ft
    expect(convertToSquareFeet(1, 'marla')).toBe(225);
    expect(convertToSquareFeet(5, 'marla')).toBe(1125);

    // 1 Kanal = 4500 sq ft (20 Marlas)
    expect(convertToSquareFeet(1, 'kanal')).toBe(4500);

    // 1 Acre = 43,560 sq ft
    expect(convertToSquareFeet(1, 'acres')).toBe(43560);
  });

  test('creates property listing and enforces 3-tier verification architecture', async () => {
    const ownerId = 'usr-seller-builder-1';
    const prop = await createPropertyListing(ownerId, {
      title: 'Luxury 4-Bed Penthouse in E-11 Islamabad',
      description: 'Stunning duplex penthouse with private terrace and Jacuzzi.',
      listingType: 'for_sale',
      propertyType: 'penthouse',
      price: 45000000,
      currency: 'PKR',
      country: 'Pakistan',
      city: 'Islamabad',
      area: 'Sector E-11',
      society: 'MPCHS',
      landSize: 3500,
      sizeUnit: 'sq_ft',
      bedrooms: 4,
      bathrooms: 5,
      mediaPaths: ['https://photos.com/p1.jpg'],
      documentPaths: ['private://docs/title_deed.pdf'], // Private vault document
      hideExactAddress: false,
      furnishingStatus: 'furnished',
      constructionStatus: 'ready',
      ownershipStatus: 'freehold',
      isAgentListing: false,
    });

    expect(prop.id).toBeTruthy();
    // Initially pending review
    expect(prop.verification_status).toBe('pending_review');
    expect(prop.verified_listing).toBe(false);
    expect(prop.documents_reviewed).toBe(true); // Document was attached

    // Admin reviews and approves listing -> Tier 3 Verified Listing Badge activated
    const reviewed = await adminReviewProperty(prop.id, 'verified', true);
    expect(reviewed).toBe(true);

    const verifiedProp = await getPropertyById(prop.id);
    expect(verifiedProp?.verification_status).toBe('verified');
    expect(verifiedProp?.verified_listing).toBe(true);
  });

  test('preserves address privacy when hide_exact_address is enabled', async () => {
    // prop-demo-3 has hide_exact_address = true
    const publicView = await getPropertyById('prop-demo-3', 'random-buyer-usr');
    expect(publicView?.hide_exact_address).toBe(true);
    expect(publicView?.street_address).toBeUndefined(); // Address hidden from public!

    // Owner viewing own property can see full address
    const ownerView = await getPropertyById('prop-demo-3', 'usr-seller-3');
    expect(ownerView?.street_address).toBe('Plot 312, Sector C');
  });

  test('manages property favourites count and user state', async () => {
    const userId = 'buyer-fav-1';
    const propId = 'prop-demo-1';

    // 1. Add to favourites
    const isFav1 = await togglePropertyFavourite(propId, userId);
    expect(isFav1).toBe(true);

    const propAfterFav = await getPropertyById(propId, userId);
    expect(propAfterFav?.is_favourited).toBe(true);
    expect(propAfterFav?.favourites_count).toBeGreaterThan(0);

    // 2. Remove from favourites
    const isFav2 = await togglePropertyFavourite(propId, userId);
    expect(isFav2).toBe(false);

    const propAfterUnfav = await getPropertyById(propId, userId);
    expect(propAfterUnfav?.is_favourited).toBe(false);
  });

  test('creates property inquiries and prevents self-inquiry by owner', async () => {
    const propId = 'prop-demo-1';
    const buyerId = 'buyer-inq-1';

    // Self inquiry by owner must fail
    await expect(
      createPropertyInquiry(propId, 'usr-seller-1', 'Is this still available?')
    ).rejects.toThrow(/own property/);

    // Buyer inquiry with offer price succeeds
    const inq = await createPropertyInquiry(
      propId,
      buyerId,
      'I am interested in this house. Would the owner consider PKR 9.2 Crore cash?',
      92000000
    );
    expect(inq.id).toBeTruthy();
    expect(inq.status).toBe('offer_submitted');
    expect(inq.offer_price).toBe(92000000);
  });

  test('schedules property viewing appointments with future timestamp validation', async () => {
    // Past date fails
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
    await expect(
      schedulePropertyViewing('prop-demo-1', 'buyer-view-1', pastDate)
    ).rejects.toThrow(/future/);

    // Future date succeeds
    const futureDate = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    const viewing = await schedulePropertyViewing(
      'prop-demo-1',
      'buyer-view-1',
      futureDate,
      null,
      'Will visit on Saturday at 4 PM with family'
    );
    expect(viewing.id).toBeTruthy();
    expect(viewing.status).toBe('pending');
    expect(viewing.scheduled_at).toBe(futureDate);
  });

  test('compares up to 4 properties side-by-side and rejects more than 4', async () => {
    const comparison = await compareProperties(['prop-demo-1', 'prop-demo-2']);
    expect(comparison).toHaveLength(2);
    expect(comparison[0].price).toBeGreaterThan(0);

    // Attempting to compare 5 properties fails
    await expect(
      compareProperties(['p1', 'p2', 'p3', 'p4', 'p5'])
    ).rejects.toThrow(/maximum 4/);
  });

  test('retrieves verified new development projects', async () => {
    const projects = await getPropertyProjects();
    expect(projects.length).toBeGreaterThanOrEqual(1);
    expect(projects[0].project_name).toContain('Al-Noor Orchard');
    expect(projects[0].is_verified_project).toBe(true);
  });
});
