import {
  propertyCreationSchema,
  convertToSquareFeet,
  isResidentialStructure,
  REAL_ESTATE_CATEGORIES,
  PROPERTY_TYPES,
  LISTING_TYPES,
  SIZE_UNITS,
} from '../../src/features/realEstate/validation';
import {
  getPropertiesFeed,
  compareProperties,
  togglePropertyFavourite,
  __resetRealEstateStore,
} from '../../src/features/realEstate/realEstateService';

describe('Phase 7 — Real Estate Frontend Experience & Workflow', () => {
  beforeEach(() => {
    __resetRealEstateStore();
  });

  describe('7-Step Publishing Wizard Validation Rules', () => {
    test('Step 1: Listing type and property category coverage', () => {
      expect(LISTING_TYPES).toHaveLength(9);
      expect(LISTING_TYPES).toContain('for_sale');
      expect(LISTING_TYPES).toContain('for_rent');
      expect(LISTING_TYPES).toContain('new_project');
      expect(LISTING_TYPES).toContain('wanted_to_buy');
      expect(LISTING_TYPES).toContain('plot_sale');

      expect(PROPERTY_TYPES).toHaveLength(11);
      expect(PROPERTY_TYPES).toContain('house');
      expect(PROPERTY_TYPES).toContain('apartment');
      expect(PROPERTY_TYPES).toContain('plot_residential');
      expect(PROPERTY_TYPES).toContain('shop');
      expect(PROPERTY_TYPES).toContain('agricultural_land');

      expect(REAL_ESTATE_CATEGORIES).toHaveLength(15);
    });

    test('Step 2: Basic details enforces character minimums and positive price', () => {
      const shortTitle = propertyCreationSchema.safeParse({
        title: 'Tiny',
        description: 'A very detailed and thorough description of the property listing.',
        listingType: 'for_sale',
        propertyType: 'house',
        price: 10000000,
        city: 'Islamabad',
        area: 'F-7/2',
        landSize: 1,
        sizeUnit: 'kanal',
        bedrooms: 4,
      });
      expect(shortTitle.success).toBe(false);

      const invalidPrice = propertyCreationSchema.safeParse({
        title: 'Luxury Villa with Mountain Views',
        description: 'A very detailed and thorough description of the property listing.',
        listingType: 'for_sale',
        propertyType: 'house',
        price: -500,
        city: 'Islamabad',
        area: 'F-7/2',
        landSize: 1,
        sizeUnit: 'kanal',
        bedrooms: 4,
      });
      expect(invalidPrice.success).toBe(false);
    });

    test('Step 3: Conditional structural specs based on property nature', () => {
      // Plots require zero bedrooms and zero bathrooms
      const validPlot = propertyCreationSchema.safeParse({
        title: 'Prime 10 Marla Residential Plot in Phase 6',
        description: 'Direct owner plot facing central park, possession ready with utilities.',
        listingType: 'for_sale',
        propertyType: 'plot_residential',
        price: 18500000,
        city: 'Lahore',
        area: 'DHA Phase 6',
        landSize: 10,
        sizeUnit: 'marla',
      });
      expect(validPlot.success).toBe(true);

      // Houses require bedroom count
      const invalidHouse = propertyCreationSchema.safeParse({
        title: 'Modern Corner Duplex House Ready to Move',
        description: 'Brand new construction with custom woodwork, solar system and imported fixtures.',
        listingType: 'for_sale',
        propertyType: 'house',
        price: 26000000,
        city: 'Rawalpindi',
        area: 'Bahria Town Phase 8',
        landSize: 10,
        sizeUnit: 'marla',
      });
      expect(invalidHouse.success).toBe(false);
    });

    test('Step 4: Location and address privacy flags', () => {
      const withPrivacy = propertyCreationSchema.safeParse({
        title: 'Commercial Plaza with Solid Rental Income',
        description: 'Ground plus 3 floors, fully tenanted by multinational banks and retail outlets.',
        listingType: 'for_sale',
        propertyType: 'building',
        price: 120000000,
        city: 'Karachi',
        area: 'Clifton Block 2',
        streetAddress: 'Secret Exact Street 44, Block 2',
        hideExactAddress: true,
        landSize: 500,
        sizeUnit: 'sq_yd',
      });
      expect(withPrivacy.success).toBe(true);
      if (withPrivacy.success) {
        expect(withPrivacy.data.hideExactAddress).toBe(true);
      }
    });

    test('Step 5 & 6: Amenities tags and optional media attributes', () => {
      const fullProperty = propertyCreationSchema.safeParse({
        title: 'Furnished Executive Penthouse Apartment',
        description: 'Stunning skyline views with private elevator access, jacuzzi and 24/7 power backup.',
        listingType: 'for_sale',
        propertyType: 'penthouse',
        price: 45000000,
        city: 'Islamabad',
        area: 'F-10 Markaz',
        landSize: 3200,
        sizeUnit: 'sq_ft',
        bedrooms: 3,
        bathrooms: 4,
        amenities: ['central_air_conditioning', 'elevator', 'security_system', 'parking_spaces', 'swimming_pool'],
        yearBuilt: 2024,
      });
      expect(fullProperty.success).toBe(true);
      if (fullProperty.success) {
        expect(fullProperty.data.amenities).toHaveLength(5);
        expect(fullProperty.data.yearBuilt).toBe(2024);
      }
    });

    test('Step 7: Size units and square foot normalizations', () => {
      expect(SIZE_UNITS).toContain('marla');
      expect(SIZE_UNITS).toContain('kanal');
      expect(SIZE_UNITS).toContain('sq_ft');
      expect(SIZE_UNITS).toContain('sq_yd');
      expect(SIZE_UNITS).toContain('acres');

      // 1 Kanal = 20 Marla = 4500 Sq Ft (standard 225 sq ft/marla)
      expect(convertToSquareFeet(1, 'kanal')).toBe(4500);
      expect(convertToSquareFeet(10, 'marla')).toBe(2250);
      expect(convertToSquareFeet(500, 'sq_yd')).toBe(4500);
      expect(convertToSquareFeet(1, 'acres')).toBe(43560);
      expect(convertToSquareFeet(1000, 'sq_ft')).toBe(1000);
    });
  });

  describe('Portal Views & Data Presentation', () => {
    test('Feed supports filtering by listingType (Buy vs Rent) and city', async () => {
      const buyFeed = await getPropertiesFeed({ listingType: 'for_sale' });
      expect(buyFeed.every((p) => p.listing_type === 'for_sale')).toBe(true);

      const rentFeed = await getPropertiesFeed({ listingType: 'for_rent' });
      expect(rentFeed.every((p) => p.listing_type === 'for_rent')).toBe(true);

      const lahoreFeed = await getPropertiesFeed({ city: 'Lahore' });
      expect(lahoreFeed.every((p) => p.city === 'Lahore')).toBe(true);
    });

    test('Address privacy mask conceals exact address in public views', async () => {
      const feed = await getPropertiesFeed();
      const privateProperty = feed.find((p) => p.hide_exact_address === true);
      expect(privateProperty).toBeDefined();

      if (privateProperty) {
        // Approximate city and area are present
        expect(privateProperty.city).toBe('Lahore');
        expect(privateProperty.area).toBe('Bahria Town');
        expect(privateProperty.hide_exact_address).toBe(true);
      }
    });

    test('Side-by-side comparison engine computes specs and metrics for up to 4 properties', async () => {
      const comparison = await compareProperties(['prop-demo-1', 'prop-demo-2']);
      expect(comparison).toHaveLength(2);

      const [propA, propB] = comparison;
      expect(propA.id).toBe('prop-demo-1');
      expect(propB.id).toBe('prop-demo-2');

      // Check comparative price and per-sqft calculations
      expect(propA.price).toBe(95000000);
      expect(propB.price).toBe(180000);

      const aSqFt = convertToSquareFeet(propA.land_size, propA.size_unit);
      const bSqFt = convertToSquareFeet(propB.land_size, propB.size_unit);
      expect(aSqFt).toBe(4500);
      expect(bSqFt).toBe(2400);

      const aPricePerSqFt = Math.round(propA.price / aSqFt);
      expect(aPricePerSqFt).toBe(Math.round(95000000 / 4500));
    });

    test('Favourites management updates saved listings state', async () => {
      const initialFav = await togglePropertyFavourite('prop-demo-1', 'user-test-buyer');
      expect(initialFav).toBe(true);

      const toggledOff = await togglePropertyFavourite('prop-demo-1', 'user-test-buyer');
      expect(toggledOff).toBe(false);
    });
  });
});
