#!/usr/bin/env node
/**
 * build.mjs — thin build script for the his-and-hers wrapper package
 *
 * The wrapper is a pre-built static entry point (index.js) that delegates
 * all logic to @his-and-hers/cli. There is nothing to compile; this script
 * just validates that index.js is present and logs success so the CI build
 * step completes without error.
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const index = join(__dirname, "index.js");

if (!existsSync(index)) {
  console.error(`[his-and-hers] ERROR: index.js not found at ${index}`);
  process.exit(1);
}

console.log("[his-and-hers] ✓ index.js present — nothing to compile for wrapper package");
