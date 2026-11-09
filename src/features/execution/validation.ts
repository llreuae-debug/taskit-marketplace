import { z } from 'zod';

export const taskProofSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  proofPhotos: z
    .array(z.string().min(1))
    .min(1, 'At least one proof photo is required (max 5)')
    .max(5, 'Maximum 5 proof photos allowed'),
  receiptPhotos: z.array(z.string().min(1)).max(5).default([]),
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
});

export const completionCodeSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{4}$/, 'Completion code must be exactly 4 digits (e.g. 1234)');

export const timeExtensionSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  additionalMinutes: z
    .number()
    .min(15, 'Minimum extension is 15 minutes')
    .max(1440, 'Maximum extension is 24 hours (1440 minutes)'),
  reason: z
    .string()
    .trim()
    .min(5, 'Please provide a reason for the extension request (minimum 5 characters)'),
});

export const taskDisputeSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  reason: z.string().trim().min(3, 'Dispute reason is required'),
  description: z
    .string()
    .trim()
    .min(10, 'Please describe the problem in detail (minimum 10 characters)'),
  evidencePhotos: z.array(z.string()).default([]),
});

export const taskRatingSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  score: z.number().int().min(1, 'Minimum rating is 1 star').max(5, 'Maximum rating is 5 stars'),
  comment: z.string().trim().max(500, 'Review cannot exceed 500 characters').optional().nullable(),
});

export const sosAlertSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  notes: z.string().trim().optional().nullable(),
});

export const chatMessageSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  body: z.string().trim().min(1, 'Message cannot be empty'),
  contentType: z.enum(['text', 'image', 'voice', 'location', 'system']).default('text'),
  mediaUrl: z.string().optional().nullable(),
});
