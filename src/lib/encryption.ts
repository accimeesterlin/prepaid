/**
 * Simple client-side encryption for PII data in localStorage
 * Uses browser's native crypto API with a derived key
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;

// Generate a stable key based on user session
async function getDerivedKey(
  customerId: string,
  orgSlug: string,
): Promise<CryptoKey> {
  const keyMaterial = `${orgSlug}:${customerId}:pgprepaid`;
  const encoder = new TextEncoder();
  const data = encoder.encode(keyMaterial);

  // Import key material
  const baseKey = await crypto.subtle.importKey(
    "raw",
    data,
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  // Derive actual encryption key
  const salt = encoder.encode("pgprepaid-salt-v1");
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt data for localStorage
 */
export async function encryptData(
  data: string,
  customerId: string,
  orgSlug: string,
): Promise<string> {
  try {
    const key = await getDerivedKey(customerId, orgSlug);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      dataBuffer,
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("Encryption failed:", error);
    throw error;
  }
}

/**
 * Decrypt data from localStorage
 */
export async function decryptData(
  encryptedData: string,
  customerId: string,
  orgSlug: string,
): Promise<string> {
  try {
    const key = await getDerivedKey(customerId, orgSlug);

    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), (c) =>
      c.charCodeAt(0),
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      data,
    );

    // Convert to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw error;
  }
}

/**
 * Encrypt and save to localStorage
 */
export async function saveEncrypted(
  key: string,
  value: any,
  customerId: string,
  orgSlug: string,
): Promise<void> {
  const jsonString = JSON.stringify(value);
  const encrypted = await encryptData(jsonString, customerId, orgSlug);
  localStorage.setItem(key, encrypted);
}

/**
 * Load and decrypt from localStorage
 */
export async function loadEncrypted<T>(
  key: string,
  customerId: string,
  orgSlug: string,
): Promise<T | null> {
  const encrypted = localStorage.getItem(key);
  if (!encrypted) return null;

  try {
    const decrypted = await decryptData(encrypted, customerId, orgSlug);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.error("Failed to load encrypted data:", error);
    // Clear corrupted data
    localStorage.removeItem(key);
    return null;
  }
}
