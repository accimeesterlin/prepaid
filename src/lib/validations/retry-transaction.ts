import { z } from "zod";

/**
 * Validation schema for retrying a failed DingConnect transaction.
 * All fields are optional — when omitted, the original transaction values are used.
 */
export const retryTransactionSchema = z.object({
  phoneNumber: z
    .string()
    .min(5, "Phone number must be at least 5 characters")
    .max(20, "Phone number must be less than 20 characters")
    .optional(),
  skuCode: z
    .string()
    .min(1, "SKU code cannot be empty")
    .max(100, "SKU code must be less than 100 characters")
    .optional(),
  sendValue: z.number().positive("Send value must be positive").optional(),
  validateOnly: z.boolean().optional().default(false),
});

export type RetryTransactionInput = z.infer<typeof retryTransactionSchema>;
