import { describe, it, expect } from "vitest";
import { getPricing, estimateCost, formatCost, formatTokens } from "./pricing.ts";

describe("getPricing", () => {
  it("returns exact model match", () => {
    const p = getPricing("anthropic/claude-sonnet-4-6");
    expect(p).not.toBeNull();
    expect(p!.inputPer1k).toBeGreaterThan(0);
  });

  it("falls back to provider when model not found", () => {
    const p = getPricing("anthropic/some-new-model");
    expect(p).not.toBeNull();
    expect(p!.inputPer1k).toBe(0.003);
  });

  it("returns $0 for ollama", () => {
    const p = getPricing("ollama");
    expect(p).not.toBeNull();
    expect(p!.inputPer1k).toBe(0);
    expect(p!.outputPer1k).toBe(0);
  });

  it("returns $0 for ollama/llama3.2", () => {
    const p = getPricing("ollama/llama3.2");
    expect(p).not.toBeNull();
    expect(p!.inputPer1k).toBe(0);
  });

  it("returns $0 for lmstudio", () => {
    const p = getPricing("lmstudio");
    expect(p).not.toBeNull();
    expect(p!.inputPer1k).toBe(0);
  });

  it("returns null for unknown provider", () => {
    expect(getPricing("mistral/something")).toBeNull();
  });
});

describe("estimateCost", () => {
  it("estimates non-zero cost for Sonnet", () => {
    const cost = estimateCost(10_000, "anthropic/claude-sonnet-4-6");
    expect(cost).not.toBeNull();
    expect(cost!).toBeGreaterThan(0);
  });

  it("returns 0 for ollama (free local model)", () => {
    const cost = estimateCost(50_000, "ollama/llama3.2");
    expect(cost).toBe(0);
  });

  it("returns null for unknown model", () => {
    expect(estimateCost(1000, "mystery/model-xyz")).toBeNull();
  });

  it("splits tokens correctly with explicit outputTokens", () => {
    // 1K input + 1K output with Sonnet:
    //   input:  1000 * ($0.003  / 1000) = $0.003
    //   output: 1000 * ($0.015 / 1000) = $0.015
    //   total: $0.018
    const cost = estimateCost(2000, "anthropic/claude-sonnet-4-6", 1000);
    expect(cost).toBeCloseTo(0.018, 6);
  });
});

describe("formatCost", () => {
  it("shows $0.00 (local) for zero", () => {
    expect(formatCost(0)).toBe("$0.00 (local)");
  });

  it("shows < $0.0001 for tiny values", () => {
    expect(formatCost(0.00001)).toBe("< $0.0001");
  });

  it("shows 4dp for sub-cent values", () => {
    expect(formatCost(0.0042)).toBe("$0.0042");
  });

  it("shows 3dp for larger values", () => {
    expect(formatCost(0.12345)).toBe("$0.123");
  });
});

describe("formatTokens", () => {
  it("shows raw count for small numbers", () => {
    expect(formatTokens(500)).toBe("500");
  });

  it("uses K suffix", () => {
    expect(formatTokens(1500)).toBe("1.5K");
  });

  it("uses M suffix", () => {
    expect(formatTokens(2_000_000)).toBe("2.0M");
  });
});
