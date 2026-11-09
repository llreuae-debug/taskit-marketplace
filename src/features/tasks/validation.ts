import { z } from 'zod';
import { calculateTaskFeeBreakdown } from '../../utils/formatters';

// Screen 1: Category Selection
export const taskScreen1Schema = z.object({
  categoryId: z.string().min(1, 'Please select a task category'),
  customData: z.record(z.any()).default({}),
});

// Screen 2: Title, Description, Voice, Photos (Max 5)
export const taskScreen2Schema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(150, 'Title cannot exceed 150 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Please describe what needs to be done (minimum 10 characters)'),
  voiceNotePath: z.string().optional().nullable(),
  photos: z
    .array(z.string())
    .max(5, 'Maximum 5 photos allowed')
    .default([]),
});

// Screen 3: Locations (Single, Pickup/Dropoff, or Online)
export const baseTaskScreen3Schema = z.object({
  locationType: z.enum(['physical_single', 'physical_pickup_dropoff', 'online']),
  // Single / General Location
  locationName: z.string().trim().optional(),
  locationAddress: z.string().trim().optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  // Pickup / Dropoff for courier
  pickupName: z.string().trim().optional(),
  pickupAddress: z.string().trim().optional(),
  pickupLatitude: z.number().min(-90).max(90).optional().nullable(),
  pickupLongitude: z.number().min(-180).max(180).optional().nullable(),
  dropoffName: z.string().trim().optional(),
  dropoffAddress: z.string().trim().optional(),
  dropoffLatitude: z.number().min(-90).max(90).optional().nullable(),
  dropoffLongitude: z.number().min(-180).max(180).optional().nullable(),
});

export const taskScreen3Schema = baseTaskScreen3Schema.refine(
  (data) => {
    if (data.locationType === 'physical_single') {
      return Boolean(data.locationAddress && data.locationAddress.trim().length >= 3);
    }
    if (data.locationType === 'physical_pickup_dropoff') {
      return (
        Boolean(data.pickupAddress && data.pickupAddress.trim().length >= 3) &&
        Boolean(data.dropoffAddress && data.dropoffAddress.trim().length >= 3)
      );
    }
    return true; // online task
  },
  {
    message: 'Physical tasks require valid location address information',
    path: ['locationAddress'],
  }
);

// Screen 4: Pricing, Budget, Deadline & Acceptance Method
export const taskScreen4Schema = z
  .object({
    currency: z.string().optional().default('PKR'),
    taskCharges: z.number().min(100, 'Minimum task reward is PKR 100'),
    expenseBudget: z.number().min(0, 'Expense budget cannot be negative').default(0),
    deadline: z.string().refine((val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d.getTime() > Date.now();
    }, 'Deadline must be a future date and time'),
    acceptanceMethod: z.enum(['instant', 'offer_only', 'both']).default('instant'),
  });

// Full 4-Screen Task Creation Payload
export const completeTaskCreationSchema = z.object({
  ...taskScreen1Schema.shape,
  ...taskScreen2Schema.shape,
  ...baseTaskScreen3Schema.shape,
  ...taskScreen4Schema.shape,
});

export type CompleteTaskCreationInput = z.input<typeof completeTaskCreationSchema>;

// Offer / Counter-Price Schema
export const taskOfferSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  offeredPrice: z.number().min(100, 'Offer must be at least PKR 100'),
  comment: z.string().trim().max(300, 'Comment cannot exceed 300 characters').optional(),
});

/**
 * Haversine formula to compute great-circle distance between two coordinates in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
