import { z } from 'zod';

export const depositInputSchema = z.object({
  amount: z.number().min(100, 'Minimum deposit amount is PKR 100'),
  currency: z.string().default('PKR'),
  provider: z.enum(['jazzcash', 'easypaisa', 'bank_transfer', 'stripe']),
});

export const withdrawalInputSchema = z
  .object({
    amount: z.number().min(500, 'Minimum withdrawal amount is PKR 500'),
    currency: z.string().default('PKR'),
    provider: z.enum(['jazzcash', 'easypaisa', 'bank_transfer', 'stripe']),
    accountTitle: z
      .string()
      .trim()
      .min(3, 'Account title must match your legal identity name (minimum 3 characters)'),
    accountNumber: z
      .string()
      .trim()
      .min(8, 'Valid account or mobile wallet number is required'),
    bankName: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.provider === 'bank_transfer') {
        return Boolean(data.bankName && data.bankName.trim().length >= 3);
      }
      return true;
    },
    {
      message: 'Bank name is required for bank transfers',
      path: ['bankName'],
    }
  );

export const escrowOperationSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  idempotencyKey: z.string().min(8, 'Unique idempotency key is required'),
});

export const refundOperationSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  refundAmount: z.number().min(1, 'Refund amount must be positive'),
  reason: z.string().trim().min(5, 'Reason for refund is required (minimum 5 characters)'),
  idempotencyKey: z.string().min(8, 'Unique idempotency key is required'),
});
