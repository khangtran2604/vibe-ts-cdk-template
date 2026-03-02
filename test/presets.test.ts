import { describe, it, expect } from "vitest";
import { getFeatureFlags, PRESET_DESCRIPTIONS } from "../src/presets.js";
import type { Preset } from "../src/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** All flags false. */
const ALL_FALSE = {
  frontend: false,
  auth: false,
  e2e: false,
  database: false,
  rds: false,
  cicd: false,
  monitoring: false,
  hooks: false,
};

/** All flags true. */
const ALL_TRUE = {
  frontend: true,
  auth: true,
  e2e: true,
  database: true,
  rds: true,
  cicd: true,
  monitoring: true,
  hooks: true,
};

// ---------------------------------------------------------------------------
// PRESET_DESCRIPTIONS
// ---------------------------------------------------------------------------

describe("PRESET_DESCRIPTIONS", () => {
  it("should be a record with exactly three entries", () => {
    const keys = Object.keys(PRESET_DESCRIPTIONS);
    expect(keys).toHaveLength(3);
  });

  it("should contain an entry for 'minimal'", () => {
    expect(PRESET_DESCRIPTIONS).toHaveProperty("minimal");
  });

  it("should contain an entry for 'standard'", () => {
    expect(PRESET_DESCRIPTIONS).toHaveProperty("standard");
  });

  it("should contain an entry for 'full'", () => {
    expect(PRESET_DESCRIPTIONS).toHaveProperty("full");
  });

  it("should have non-empty string descriptions for every preset", () => {
    const presets: Preset[] = ["minimal", "standard", "full"];
    for (const preset of presets) {
      expect(typeof PRESET_DESCRIPTIONS[preset]).toBe("string");
      expect(PRESET_DESCRIPTIONS[preset].trim().length).toBeGreaterThan(0);
    }
  });

  it("should have distinct descriptions for each preset", () => {
    const descriptions = Object.values(PRESET_DESCRIPTIONS);
    const unique = new Set(descriptions);
    expect(unique.size).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// getFeatureFlags — minimal preset
// ---------------------------------------------------------------------------

describe("getFeatureFlags('minimal')", () => {
  it("should return all feature flags as false", () => {
    expect(getFeatureFlags("minimal")).toEqual(ALL_FALSE);
  });

  it("should return frontend: false", () => {
    expect(getFeatureFlags("minimal").frontend).toBe(false);
  });

  it("should return auth: false", () => {
    expect(getFeatureFlags("minimal").auth).toBe(false);
  });

  it("should return e2e: false", () => {
    expect(getFeatureFlags("minimal").e2e).toBe(false);
  });

  it("should return database: false", () => {
    expect(getFeatureFlags("minimal").database).toBe(false);
  });

  it("should return rds: false", () => {
    expect(getFeatureFlags("minimal").rds).toBe(false);
  });

  it("should return cicd: false", () => {
    expect(getFeatureFlags("minimal").cicd).toBe(false);
  });

  it("should return monitoring: false", () => {
    expect(getFeatureFlags("minimal").monitoring).toBe(false);
  });

  it("should return hooks: false", () => {
    expect(getFeatureFlags("minimal").hooks).toBe(false);
  });

  it("should still return rds: false even when rds override is true (database guard)", () => {
    // rds requires database: true; minimal has database: false so the guard
    // prevents rds from ever being enabled for minimal.
    expect(getFeatureFlags("minimal", { rds: true }).rds).toBe(false);
  });

  it("should not mutate the base preset record on successive calls", () => {
    getFeatureFlags("minimal", { rds: true });
    expect(getFeatureFlags("minimal").rds).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getFeatureFlags — standard preset
// ---------------------------------------------------------------------------

describe("getFeatureFlags('standard')", () => {
  it("should return frontend: true", () => {
    expect(getFeatureFlags("standard").frontend).toBe(true);
  });

  it("should return auth: true", () => {
    expect(getFeatureFlags("standard").auth).toBe(true);
  });

  it("should return e2e: true", () => {
    expect(getFeatureFlags("standard").e2e).toBe(true);
  });

  it("should return database: false", () => {
    expect(getFeatureFlags("standard").database).toBe(false);
  });

  it("should return rds: false", () => {
    expect(getFeatureFlags("standard").rds).toBe(false);
  });

  it("should return cicd: false", () => {
    expect(getFeatureFlags("standard").cicd).toBe(false);
  });

  it("should return monitoring: false", () => {
    expect(getFeatureFlags("standard").monitoring).toBe(false);
  });

  it("should return hooks: false", () => {
    expect(getFeatureFlags("standard").hooks).toBe(false);
  });

  it("should still return rds: false even when rds override is true (database guard)", () => {
    // standard has database: false so rds remains false regardless of override.
    expect(getFeatureFlags("standard", { rds: true }).rds).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getFeatureFlags — full preset (no overrides)
// ---------------------------------------------------------------------------

describe("getFeatureFlags('full')", () => {
  it("should return frontend: true", () => {
    expect(getFeatureFlags("full").frontend).toBe(true);
  });

  it("should return auth: true", () => {
    expect(getFeatureFlags("full").auth).toBe(true);
  });

  it("should return e2e: true", () => {
    expect(getFeatureFlags("full").e2e).toBe(true);
  });

  it("should return database: true", () => {
    expect(getFeatureFlags("full").database).toBe(true);
  });

  it("should return rds: false by default (opt-in only)", () => {
    // RDS is expensive — it is off even for the full preset unless the user
    // explicitly opts in.
    expect(getFeatureFlags("full").rds).toBe(false);
  });

  it("should return cicd: true", () => {
    expect(getFeatureFlags("full").cicd).toBe(true);
  });

  it("should return monitoring: true", () => {
    expect(getFeatureFlags("full").monitoring).toBe(true);
  });

  it("should return hooks: true", () => {
    expect(getFeatureFlags("full").hooks).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getFeatureFlags — full preset with rds: true override
// ---------------------------------------------------------------------------

describe("getFeatureFlags('full', { rds: true })", () => {
  it("should return all feature flags as true", () => {
    expect(getFeatureFlags("full", { rds: true })).toEqual(ALL_TRUE);
  });

  it("should return rds: true when override is provided", () => {
    expect(getFeatureFlags("full", { rds: true }).rds).toBe(true);
  });

  it("should return database: true alongside rds: true", () => {
    const flags = getFeatureFlags("full", { rds: true });
    expect(flags.database).toBe(true);
    expect(flags.rds).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getFeatureFlags — return value immutability
// ---------------------------------------------------------------------------

describe("getFeatureFlags — immutability", () => {
  it("should return a new object on every call (not the same reference)", () => {
    const a = getFeatureFlags("full");
    const b = getFeatureFlags("full");
    expect(a).not.toBe(b);
  });

  it("should not affect subsequent calls when returned object is mutated", () => {
    const flags = getFeatureFlags("full");
    // Force-mutate the returned copy.
    (flags as Record<string, boolean>)["rds"] = true;
    // The next call should still produce the unmutated default.
    expect(getFeatureFlags("full").rds).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getFeatureFlags — options parameter is optional
// ---------------------------------------------------------------------------

describe("getFeatureFlags — options parameter", () => {
  it("should work without providing the options argument at all", () => {
    expect(() => getFeatureFlags("minimal")).not.toThrow();
    expect(() => getFeatureFlags("standard")).not.toThrow();
    expect(() => getFeatureFlags("full")).not.toThrow();
  });

  it("should work with an empty options object", () => {
    expect(getFeatureFlags("full", {})).toEqual(getFeatureFlags("full"));
  });

  it("should work with rds: false explicitly (same as default)", () => {
    expect(getFeatureFlags("full", { rds: false })).toEqual(
      getFeatureFlags("full")
    );
  });
});
