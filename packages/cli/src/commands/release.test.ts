import { describe, it, expect } from "vitest";
import { bumpVersion, buildChangelogEntry } from "./release.ts";

describe("release", () => {
  describe("bumpVersion", () => {
    it("should bump patch version", () => {
      expect(bumpVersion("0.3.0", "patch")).toBe("0.3.1");
      expect(bumpVersion("1.2.3", "patch")).toBe("1.2.4");
      expect(bumpVersion("10.20.99", "patch")).toBe("10.20.100");
    });

    it("should bump minor version and reset patch", () => {
      expect(bumpVersion("0.3.0", "minor")).toBe("0.4.0");
      expect(bumpVersion("1.2.3", "minor")).toBe("1.3.0");
      expect(bumpVersion("10.20.99", "minor")).toBe("10.21.0");
    });

    it("should bump major version and reset minor + patch", () => {
      expect(bumpVersion("0.3.0", "major")).toBe("1.0.0");
      expect(bumpVersion("1.2.3", "major")).toBe("2.0.0");
      expect(bumpVersion("10.20.99", "major")).toBe("11.0.0");
    });

    it("should handle version 0.0.0", () => {
      expect(bumpVersion("0.0.0", "patch")).toBe("0.0.1");
      expect(bumpVersion("0.0.0", "minor")).toBe("0.1.0");
      expect(bumpVersion("0.0.0", "major")).toBe("1.0.0");
    });

    it("should throw on invalid semver", () => {
      expect(() => bumpVersion("1.2", "patch")).toThrow("Invalid semver version");
      expect(() => bumpVersion("1.2.3.4", "patch")).toThrow("Invalid semver version");
      expect(() => bumpVersion("abc", "patch")).toThrow("Invalid semver version");
      expect(() => bumpVersion("1.x.3", "patch")).toThrow("Invalid semver version");
    });

    it("should handle large version numbers", () => {
      expect(bumpVersion("99.99.99", "patch")).toBe("99.99.100");
      expect(bumpVersion("99.99.99", "minor")).toBe("99.100.0");
      expect(bumpVersion("99.99.99", "major")).toBe("100.0.0");
    });
  });

  describe("buildChangelogEntry", () => {
    it("should include version and date", () => {
      const entry = buildChangelogEntry("1.2.3");
      const today = new Date().toISOString().slice(0, 10);

      expect(entry).toContain(`## v1.2.3 (${today})`);
    });

    it("should format with markdown header", () => {
      const entry = buildChangelogEntry("0.4.0");

      expect(entry).toMatch(/^## v0\.4\.0 \(\d{4}-\d{2}-\d{2}\)/);
    });

    it("should include commit list", () => {
      const entry = buildChangelogEntry("1.0.0");

      // Entry should have at least a header and some content
      expect(entry.split("\n").length).toBeGreaterThanOrEqual(2);
    });

    it("should handle versions with different formats", () => {
      const entry1 = buildChangelogEntry("0.0.1");
      const entry2 = buildChangelogEntry("10.20.30");
      const entry3 = buildChangelogEntry("1.0.0-beta.1");

      expect(entry1).toContain("## v0.0.1");
      expect(entry2).toContain("## v10.20.30");
      expect(entry3).toContain("## v1.0.0-beta.1");
    });
  });
});
