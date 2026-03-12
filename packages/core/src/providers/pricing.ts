/**
 * providers/pricing.ts
 *
 * Per-token cost tables for known providers.
 * Local providers (ollama, lmstudio) are free.
 *
 * Prices are in USD per 1,000 tokens (as of 2026-Q1).
 * Update when providers change their pricing.
 */

export interface TokenPrice {
  /** USD per 1K input tokens */
  inputPer1k: number;
  /** USD per 1K output tokens */
  outputPer1k: number;
}

/**
 * Model-specific pricing overrides.
 * Key format: "<provider>/<model>" or just "<model>" for cross-provider matching.
 */
const MODEL_PRICES: Record<string, TokenPrice> = {
  // Anthropic
  "anthropic/claude-opus-4-5":        { inputPer1k: 0.015,  outputPer1k: 0.075  },
  "anthropic/claude-sonnet-4-6":      { inputPer1k: 0.003,  outputPer1k: 0.015  },
  "anthropic/claude-haiku-3-5":       { inputPer1k: 0.00025,outputPer1k: 0.00125},
  // OpenAI
  "openai/gpt-4o":                    { inputPer1k: 0.0025, outputPer1k: 0.01   },
  "openai/gpt-4o-mini":               { inputPer1k: 0.00015,outputPer1k: 0.0006 },
  "openai/o3-mini":                   { inputPer1k: 0.0011, outputPer1k: 0.0044 },
  // Local — always $0
  "ollama":                           { inputPer1k: 0,       outputPer1k: 0      },
  "lmstudio":                         { inputPer1k: 0,       outputPer1k: 0      },
  "custom":                           { inputPer1k: 0,       outputPer1k: 0      },
};

/** Provider-level fallbacks when no model match is found */
const PROVIDER_FALLBACKS: Record<string, TokenPrice> = {
  anthropic: { inputPer1k: 0.003,  outputPer1k: 0.015  },
  openai:    { inputPer1k: 0.0025, outputPer1k: 0.01   },
  ollama:    { inputPer1k: 0,       outputPer1k: 0      },
  lmstudio:  { inputPer1k: 0,       outputPer1k: 0      },
  custom:    { inputPer1k: 0,       outputPer1k: 0      },
};

/**
 * Look up pricing for a model string.
 * Accepts "provider/model", "model", or just "provider".
 *
 * Returns null if no pricing data is available (treat as unknown cost).
 */
export function getPricing(model: string): TokenPrice | null {
  // Exact match first
  if (model in MODEL_PRICES) return MODEL_PRICES[model]!;

  // Try "provider/model" where provider is the prefix
  const slashIdx = model.indexOf("/");
  if (slashIdx !== -1) {
    const provider = model.slice(0, slashIdx);
    if (provider in PROVIDER_FALLBACKS) return PROVIDER_FALLBACKS[provider]!;
  }

  // Try the raw string as a provider name
  if (model in PROVIDER_FALLBACKS) return PROVIDER_FALLBACKS[model]!;

  return null;
}

/**
 * Estimate cost for a completed task.
 *
 * If output_tokens is not available, assumes a 1:3 input:output split
 * (rough heuristic for most tasks).
 *
 * Returns USD cost, or null if pricing is unknown.
 */
export function estimateCost(
  totalTokens: number,
  model: string,
  outputTokens?: number,
): number | null {
  const prices = getPricing(model);
  if (!prices) return null;

  const outputToks = outputTokens ?? Math.round(totalTokens * 0.75);
  const inputToks = totalTokens - outputToks;

  return (inputToks / 1000) * prices.inputPer1k + (outputToks / 1000) * prices.outputPer1k;
}

/** Format a USD cost for display, e.g. "$0.0042" or "< $0.0001" */
export function formatCost(usd: number): string {
  if (usd === 0) return "$0.00 (local)";
  if (usd < 0.0001) return "< $0.0001";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(3)}`;
}

/** Format token count for display */
export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}
