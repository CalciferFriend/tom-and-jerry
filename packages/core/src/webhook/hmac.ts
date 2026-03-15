/**
 * core/webhook/hmac.ts
 *
 * HMAC-SHA256 signature verification for inbound webhooks.
 * Compatible with GitHub webhook signatures (X-Hub-Signature-256: sha256=<hex>).
 *
 * Uses timing-safe comparison to prevent timing attacks.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Compute the HMAC-SHA256 of `payload` using `secret`.
 * Returns "sha256=<hex>" — the format used by GitHub webhooks.
 */
export function computeHmacSignature(secret: string, payload: string): string {
  const digest = createHmac("sha256", secret)
    .update(payload, "utf-8")
    .digest("hex");
  return `sha256=${digest}`;
}

/**
 * Verify a webhook signature header value against the raw body.
 *
 * @param secret   — shared secret used to compute HMAC
 * @param payload  — raw request body string
 * @param signature — header value from the request (e.g. "sha256=abc123...")
 * @returns true if the signature matches, false otherwise
 */
export function verifyHmacSignature(
  secret: string,
  payload: string,
  signature: string,
): boolean {
  if (!signature) return false;

  const expected = computeHmacSignature(secret, payload);

  // Both buffers must be the same length for timingSafeEqual
  const expectedBuf = Buffer.from(expected, "utf-8");
  const actualBuf = Buffer.from(signature, "utf-8");

  if (expectedBuf.length !== actualBuf.length) return false;

  try {
    return timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}
