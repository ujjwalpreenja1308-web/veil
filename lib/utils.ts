import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { randomBytes, createHash } from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a cryptographically secure Veil API key.
 * Format: vl_ + 64 hex chars = 67 chars total, 256 bits of entropy.
 */
export function generateApiKey(): string {
  return "vl_" + randomBytes(32).toString("hex")
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Maps an arbitrary client session_id string to a stable UUID scoped to the org.
 * If the client already sent a valid UUID, returns it as-is.
 * Otherwise derives a deterministic UUID (v4-shaped) from SHA-256(orgId + ":" + sessionId)
 * so the same string always resolves to the same UUID within an org.
 */
export function toSessionUuid(orgId: string, clientSessionId: string): string {
  if (UUID_RE.test(clientSessionId)) return clientSessionId;
  const hash = createHash("sha256").update(`${orgId}:${clientSessionId}`).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    ((parseInt(hash[16], 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}
