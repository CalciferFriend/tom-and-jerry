/**
 * core/webhook/interpolate.ts
 *
 * Template interpolation for webhook task templates.
 *
 * Supported placeholders:
 *   {{body.<key>}}        — JSON body field (dot-notation, depth ≤ 5)
 *   {{headers.<key>}}     — request header value (lowercase key)
 *   {{query.<key>}}       — URL query param
 *   {{body_raw}}          — full raw body string
 *   {{webhook.name}}      — webhook label (or path if unnamed)
 *   {{webhook.path}}      — registered path
 *   {{webhook.peer}}      — target peer name (or "auto")
 *
 * Missing keys are replaced with "" (empty string), not left as placeholders.
 */

import type { WebhookRequestContext } from "./schema.ts";

const PLACEHOLDER_RE = /\{\{([^}]+)\}\}/g;
const MAX_DEPTH = 5;

/**
 * Resolve a dot-notation key against a nested object.
 * Returns undefined if any segment is missing or max depth exceeded.
 */
export function resolveDotPath(
  obj: Record<string, unknown>,
  path: string,
): string | undefined {
  const parts = path.split(".");
  if (parts.length > MAX_DEPTH) return undefined;

  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  if (current == null) return undefined;
  if (typeof current === "string") return current;
  if (typeof current === "number" || typeof current === "boolean") {
    return String(current);
  }
  // Arrays/objects → JSON
  return JSON.stringify(current);
}

/**
 * Interpolate a task template with request context.
 * Unknown placeholders resolve to "".
 */
export function interpolateTemplate(
  template: string,
  ctx: WebhookRequestContext,
): string {
  return template.replace(PLACEHOLDER_RE, (_match, key: string) => {
    const trimmed = key.trim();

    if (trimmed === "body_raw") return ctx.body_raw;

    if (trimmed.startsWith("body.")) {
      return resolveDotPath(ctx.body, trimmed.slice("body.".length)) ?? "";
    }

    if (trimmed.startsWith("headers.")) {
      const headerKey = trimmed.slice("headers.".length).toLowerCase();
      return ctx.headers[headerKey] ?? "";
    }

    if (trimmed.startsWith("query.")) {
      const queryKey = trimmed.slice("query.".length);
      return ctx.query[queryKey] ?? "";
    }

    if (trimmed === "webhook.name") {
      return ctx.webhook.name ?? ctx.webhook.path;
    }
    if (trimmed === "webhook.path") {
      return ctx.webhook.path;
    }
    if (trimmed === "webhook.peer") {
      return ctx.webhook.peer ?? "auto";
    }

    // Unknown placeholder → empty string
    return "";
  });
}

/**
 * Extract all placeholder keys from a template string.
 * Useful for validation / preview.
 */
export function extractPlaceholders(template: string): string[] {
  const found: string[] = [];
  for (const match of template.matchAll(PLACEHOLDER_RE)) {
    found.push(match[1].trim());
  }
  return found;
}
