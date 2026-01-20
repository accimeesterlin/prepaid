import { z } from 'zod';

/**
 * Forgot password request validation schema
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password request validation schema
 */
export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password must not exceed 100 characters'),
});

export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

/**
 * Verify reset token query validation schema
 */
export const verifyResetTokenSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
});

export type VerifyResetTokenRequest = z.infer<typeof verifyResetTokenSchema>;
