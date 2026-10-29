import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 16 bytes for AES-GCM IV

/**
 * Retrieves and validates the 32-byte encryption key from environment variables.
 * Supports 64-character hex string or 32-character utf-8 string.
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;

  if (!envKey) {
    throw new Error(
      "Missing ENCRYPTION_KEY environment variable. It must be a 32-byte hex or string."
    );
  }

  // If 64 hex characters, parse as hex (32 bytes)
  if (envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
    return Buffer.from(envKey, "hex");
  }

  // If 32 characters, parse as utf-8
  if (envKey.length === 32) {
    return Buffer.from(envKey, "utf-8");
  }

  // Fallback: derive 32-byte key deterministically via SHA-256
  return crypto.createHash("sha256").update(envKey).digest();
}

/**
 * Encrypts a plaintext string (e.g. OAuth refresh token) using AES-256-GCM.
 * Output format: ${iv}:${authTag}:${encrypted} (hex encoded)
 */
export function encrypt(text: string): string {
  if (!text) {
    throw new Error("Cannot encrypt empty or null text");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts a ciphertext in the format ${iv}:${authTag}:${encrypted}.
 */
export function decrypt(encryptedToken: string): string {
  if (!encryptedToken) {
    throw new Error("Cannot decrypt empty or null token");
  }

  const parts = encryptedToken.split(":");
  if (parts.length !== 3) {
    throw new Error(
      "Invalid encrypted token format. Expected ${iv}:${authTag}:${encrypted}"
    );
  }

  const [ivHex, authTagHex, encryptedData] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
