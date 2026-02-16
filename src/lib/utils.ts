import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitizes a phone number for use in a WhatsApp wa.me link.
 * Strips all non-digit characters (spaces, dashes, parentheses, + prefix).
 * Returns digits only with country code, no + prefix.
 */
export function sanitizePhoneForWhatsApp(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, "");
}
