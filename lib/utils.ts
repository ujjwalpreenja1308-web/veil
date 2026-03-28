import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { randomBytes } from "crypto"

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
