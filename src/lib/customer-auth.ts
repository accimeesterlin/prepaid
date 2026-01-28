/**
 * Customer Authentication Service
 * Handles JWT tokens for customer authentication (separate from staff auth)
 */

import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.CUSTOMER_JWT_SECRET || "customer-secret-key-change-in-production",
);

export interface CustomerSessionPayload extends JWTPayload {
  customerId: string;
  orgId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

/**
 * Create a customer session (JWT token)
 */
export async function createCustomerSession(
  payload: CustomerSessionPayload,
): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // 7 days expiry
    .sign(secret);

  // Set cookie
  (await cookies()).set("customer-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return token;
}

/**
 * Get current customer session
 */
export async function getCustomerSession(): Promise<CustomerSessionPayload | null> {
  const token = (await cookies()).get("customer-session")?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as CustomerSessionPayload;
  } catch (_error) {
    return null;
  }
}

/**
 * Delete customer session
 */
export async function deleteCustomerSession(): Promise<void> {
  (await cookies()).delete("customer-session");
}

/**
 * Verify customer JWT token (without setting cookie)
 */
export async function verifyCustomerToken(
  token: string,
): Promise<CustomerSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as CustomerSessionPayload;
  } catch (_error) {
    return null;
  }
}
