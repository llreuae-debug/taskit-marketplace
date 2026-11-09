import { z } from 'zod';
import { PropertyTypeCategory, PropertySizeUnit } from '../../types/realEstate';

// Property types that require or support residential rooms
export const RESIDENTIAL_ROOM_TYPES: PropertyTypeCategory[] = [
  'house',
  'apartment',
  'penthouse',
  'villa',
];

export function isResidentialStructure(type: PropertyTypeCategory): boolean {
  return RESIDENTIAL_ROOM_TYPES.includes(type);
}

// Convert various Pakistani & International units to approximate Square Feet
export const SIZE_CONVERSION_TO_SQFT: Record<PropertySizeUnit, number> = {
  marla: 225, // Standard Pakistani residential marla
  kanal: 4500, // 20 Marlas = 4500 sq ft
  sq_ft: 1,
  sq_yd: 9,
  acres: 43560,
  sq_m: 10.764,
};

export function convertToSquareFeet(size: number, unit: PropertySizeUnit): number {
  const multiplier = SIZE_CONVERSION_TO_SQFT[unit] || 1;
  return Math.round(size * multiplier);
}

// Property Listing Creation Schema
export const propertyCreationSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, 'Property title must be at least 5 characters')
      .max(180, 'Title cannot exceed 180 characters'),
    description: z
      .string()
      .trim()
      .min(15, 'Please provide a detailed property description (minimum 15 characters)'),
    listingType: z.enum([
      'for_sale',
      'for_rent',
      'wanted_to_buy',
      'wanted_to_rent',
      'commercial_sale',
      'commercial_rental',
      'plot_sale',
      'new_project',
      'development_project',
    ]),
    propertyType: z.enum([
      'house',
      'apartment',
      'plot_residential',
      'plot_commercial',
      'shop',
      'office',
      'building',
      'agricultural_land',
      'industrial_property',
      'penthouse',
      'villa',
    ]),
    price: z.number().min(0, 'Asking price must be positive'),
    currency: z.string().default('PKR'),
    country: z.string().default('Pakistan'),
    city: z.string().trim().min(2, 'City is required'),
    area: z.string().trim().min(2, 'Area / Sector is required'),
    society: z.string().trim().optional().nullable(),
    streetAddress: z.string().trim().optional().nullable(),
    hideExactAddress: z.boolean().default(false),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    landSize: z.number().min(0.1, 'Property size must be greater than zero'),
    sizeUnit: z.enum(['marla', 'kanal', 'sq_ft', 'sq_yd', 'acres', 'sq_m']).default('marla'),
    coveredArea: z.number().min(0).optional().nullable(),
    bedrooms: z.number().int().min(0).optional().nullable(),
    bathrooms: z.number().int().min(0).optional().nullable(),
    floors: z.number().int().min(0).optional().nullable(),
    parkingSpaces: z.number().int().min(0).optional().nullable(),
    furnishingStatus: z.enum(['unfurnished', 'semi_furnished', 'furnished']).default('unfurnished'),
    constructionStatus: z.enum(['ready', 'under_construction', 'off_plan']).default('ready'),
    ownershipStatus: z.enum(['freehold', 'leasehold', 'power_of_attorney']).default('freehold'),
    isAgentListing: z.boolean().default(false),
    mediaPaths: z.array(z.string()).max(20, 'Maximum 20 photos allowed').default([]),
    documentPaths: z.array(z.string()).default([]),
  })
  .refine(
    (data) => {
      // If it's a house or apartment, bedrooms and bathrooms can be specified
      // For plots, land, or shops, bedrooms/bathrooms are NOT enforced
      if (isResidentialStructure(data.propertyType)) {
        return data.bedrooms !== undefined && data.bedrooms !== null && data.bedrooms >= 0;
      }
      return true;
    },
    {
      message: 'Bedrooms count is required for residential structures',
      path: ['bedrooms'],
    }
  );

export type PropertyCreationInput = z.infer<typeof propertyCreationSchema>;

// Property Inquiry / Offer Schema
export const propertyInquirySchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  message: z.string().trim().min(5, 'Inquiry message must be at least 5 characters'),
  offerPrice: z.number().min(1000, 'Offer price must be realistic').optional().nullable(),
});

// Property Viewing Appointment Schema
export const propertyViewingSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  inquiryId: z.string().optional().nullable(),
  scheduledAt: z.string().refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime()) && d.getTime() > Date.now();
  }, 'Viewing appointment must be a future date and time'),
  notes: z.string().trim().max(300).optional().nullable(),
});
