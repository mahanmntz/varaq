import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

/** HMAC of a normalized contact (phone/email). Raw contacts are never persisted. */
export function hashContact(normalizedContact: string, pepper: string): string {
  return createHmac("sha256", pepper).update(normalizedContact).digest("hex");
}

export function randomDigits(length: number): string {
  return Array.from({ length }, () => randomInt(0, 10)).join("");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function randomCode(length: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => alphabet[randomInt(0, alphabet.length)]).join("");
}
