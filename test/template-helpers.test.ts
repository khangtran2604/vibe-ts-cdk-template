import { describe, it, expect } from "vitest";
import {
  getTemplateDirs,
  getVariableMap,
  getWorkspaceEntries,
} from "../src/template-helpers.js";
import type { FeatureFlags, ProjectConfig } from "../src/types.js";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

/** All feature flags disabled — corresponds to the minimal preset. */
const ALL_OFF: FeatureFlags = {
  frontend: false,
  auth: false,
  e2e: false,
  database: false,
  rds: false,
  cicd: false,
  monitoring: false,
  hooks: false,
};

/** Feature flags for the standard preset (frontend + auth + e2e). */
const STANDARD: FeatureFlags = {
  frontend: true,
  auth: true,
  e2e: true,
  database: false,
  rds: false,
  cicd: false,
  monitoring: false,
  hooks: false,
};

/** Feature flags for the full preset (all optional features, rds off by default). */
const FULL: FeatureFlags = {
  frontend: true,
  auth: true,
  e2e: true,
  database: true,
  rds: false,
  cicd: true,
  monitoring: true,
  hooks: true,
};

/** Minimal ProjectConfig used to exercise getVariableMap. */
const BASE_CONFIG: ProjectConfig = {
  projectName: "my-app",
  preset: "minimal",
  awsRegion: "us-east-1",
  features: ALL_OFF,
  gitInit: true,
  installDeps: true,
};

// ---------------------------------------------------------------------------
// getTemplateDirs — core directories (always present)
// ---------------------------------------------------------------------------

describe("getTemplateDirs — core directories", () => {
  it("should always include 'base' as the first entry", () => {
    expect(getTemplateDirs(ALL_OFF)[0]).toBe("base");
  });

  it("should always include 'infra'", () => {
    expect(getTemplateDirs(ALL_OFF)).toContain("infra");
  });

  it("should always include 'services'", () => {
    expect(getTemplateDirs(ALL_OFF)).toContain("services");
  });

  it("should always include 'dev-gateway'", () => {
    expect(getTemplateDirs(ALL_OFF)).toContain("dev-gateway");
  });

  it("should always include 'packages'", () => {
    expect(getTemplateDirs(ALL_OFF)).toContain("packages");
  });

  it("should return exactly the five core dirs for the minimal preset", () => {
    expect(getTemplateDirs(ALL_OFF)).toEqual([
      "base",
      "infra",
      "services",
      "dev-gateway",
      "packages",
    ]);
  });
});

// ---------------------------------------------------------------------------
// getTemplateDirs — conditional directories
// ---------------------------------------------------------------------------

describe("getTemplateDirs — conditional directories not included when flags are off", () => {
  it("should not include 'frontend' when frontend is false", () => {
    expect(getTemplateDirs(ALL_OFF)).not.toContain("frontend");
  });

  it("should not include 'auth' when auth is false", () => {
    expect(getTemplateDirs(ALL_OFF)).not.toContain("auth");
  });

  it("should not include 'e2e' when e2e is false", () => {
    expect(getTemplateDirs(ALL_OFF)).not.toContain("e2e");
  });

  it("should not include 'database' when database is false", () => {
    expect(getTemplateDirs(ALL_OFF)).not.toContain("database");
  });

  it("should not include 'cicd' when cicd is false", () => {
    expect(getTemplateDirs(ALL_OFF)).not.toContain("cicd");
  });

  it("should not include 'monitoring' when monitoring is false", () => {
    expect(getTemplateDirs(ALL_OFF)).not.toContain("monitoring");
  });

  it("should not include 'extras' when hooks is false", () => {
    expect(getTemplateDirs(ALL_OFF)).not.toContain("extras");
  });
});

describe("getTemplateDirs — individual flags add the correct directory", () => {
  it("should include 'frontend' when frontend flag is true", () => {
    expect(getTemplateDirs({ ...ALL_OFF, frontend: true })).toContain("frontend");
  });

  it("should include 'auth' when auth flag is true", () => {
    expect(getTemplateDirs({ ...ALL_OFF, auth: true })).toContain("auth");
  });

  it("should include 'e2e' when e2e flag is true", () => {
    expect(getTemplateDirs({ ...ALL_OFF, e2e: true })).toContain("e2e");
  });

  it("should include 'database' when database flag is true", () => {
    expect(getTemplateDirs({ ...ALL_OFF, database: true })).toContain("database");
  });

  it("should include 'cicd' when cicd flag is true", () => {
    expect(getTemplateDirs({ ...ALL_OFF, cicd: true })).toContain("cicd");
  });

  it("should include 'monitoring' when monitoring flag is true", () => {
    expect(getTemplateDirs({ ...ALL_OFF, monitoring: true })).toContain("monitoring");
  });

  it("should include 'extras' (not 'hooks') when hooks flag is true", () => {
    const dirs = getTemplateDirs({ ...ALL_OFF, hooks: true });
    expect(dirs).toContain("extras");
    expect(dirs).not.toContain("hooks");
  });
});

// ---------------------------------------------------------------------------
// getTemplateDirs — standard preset
// ---------------------------------------------------------------------------

describe("getTemplateDirs — standard preset", () => {
  it("should return all core directories plus frontend, auth, e2e", () => {
    expect(getTemplateDirs(STANDARD)).toEqual([
      "base",
      "infra",
      "services",
      "dev-gateway",
      "packages",
      "frontend",
      "auth",
      "e2e",
    ]);
  });

  it("should not include 'database', 'cicd', 'monitoring', or 'extras'", () => {
    const dirs = getTemplateDirs(STANDARD);
    for (const dir of ["database", "cicd", "monitoring", "extras"]) {
      expect(dirs).not.toContain(dir);
    }
  });
});

// ---------------------------------------------------------------------------
// getTemplateDirs — full preset
// ---------------------------------------------------------------------------

describe("getTemplateDirs — full preset", () => {
  it("should return all directories in the correct order", () => {
    expect(getTemplateDirs(FULL)).toEqual([
      "base",
      "infra",
      "services",
      "dev-gateway",
      "packages",
      "frontend",
      "auth",
      "e2e",
      "database",
      "cicd",
      "monitoring",
      "extras",
    ]);
  });

  it("should include 'extras' for the hooks flag (full preset)", () => {
    expect(getTemplateDirs(FULL)).toContain("extras");
  });

  it("should have 'base' as the first element", () => {
    expect(getTemplateDirs(FULL)[0]).toBe("base");
  });

  it("should have 'extras' as the last element", () => {
    const dirs = getTemplateDirs(FULL);
    expect(dirs[dirs.length - 1]).toBe("extras");
  });
});

// ---------------------------------------------------------------------------
// getTemplateDirs — return value is a new array each call
// ---------------------------------------------------------------------------

describe("getTemplateDirs — return value isolation", () => {
  it("should return a new array on every call", () => {
    expect(getTemplateDirs(ALL_OFF)).not.toBe(getTemplateDirs(ALL_OFF));
  });

  it("should not be affected by mutation of the returned array", () => {
    const dirs = getTemplateDirs(ALL_OFF);
    dirs.push("injected");
    expect(getTemplateDirs(ALL_OFF)).toEqual([
      "base",
      "infra",
      "services",
      "dev-gateway",
      "packages",
    ]);
  });
});

// ---------------------------------------------------------------------------
// getVariableMap — required keys
// ---------------------------------------------------------------------------

describe("getVariableMap — required keys", () => {
  it("should include 'projectName' in the returned map", () => {
    expect(getVariableMap(BASE_CONFIG)).toHaveProperty("projectName");
  });

  it("should include 'awsRegion' in the returned map", () => {
    expect(getVariableMap(BASE_CONFIG)).toHaveProperty("awsRegion");
  });

  it("should map projectName to the config value", () => {
    const map = getVariableMap({ ...BASE_CONFIG, projectName: "my-cool-app" });
    expect(map.projectName).toBe("my-cool-app");
  });

  it("should map awsRegion to the config value", () => {
    const map = getVariableMap({ ...BASE_CONFIG, awsRegion: "eu-west-1" });
    expect(map.awsRegion).toBe("eu-west-1");
  });

  it("should return string values only", () => {
    const map = getVariableMap(BASE_CONFIG);
    for (const value of Object.values(map)) {
      expect(typeof value).toBe("string");
    }
  });
});

describe("getVariableMap — config values are reflected accurately", () => {
  it("should reflect the projectName passed in the config", () => {
    const map = getVariableMap({ ...BASE_CONFIG, projectName: "hello-world" });
    expect(map["projectName"]).toBe("hello-world");
  });

  it("should reflect the awsRegion passed in the config", () => {
    const map = getVariableMap({ ...BASE_CONFIG, awsRegion: "ap-southeast-1" });
    expect(map["awsRegion"]).toBe("ap-southeast-1");
  });

  it("should return a new object on every call", () => {
    expect(getVariableMap(BASE_CONFIG)).not.toBe(getVariableMap(BASE_CONFIG));
  });
});

// ---------------------------------------------------------------------------
// getWorkspaceEntries — core entries (always present)
// ---------------------------------------------------------------------------

describe("getWorkspaceEntries — core entries", () => {
  it("should always include 'infra'", () => {
    expect(getWorkspaceEntries(ALL_OFF)).toContain("infra");
  });

  it("should always include 'services/*'", () => {
    expect(getWorkspaceEntries(ALL_OFF)).toContain("services/*");
  });

  it("should always include 'dev-gateway'", () => {
    expect(getWorkspaceEntries(ALL_OFF)).toContain("dev-gateway");
  });

  it("should always include 'packages/*'", () => {
    expect(getWorkspaceEntries(ALL_OFF)).toContain("packages/*");
  });

  it("should return exactly four entries for the minimal preset", () => {
    expect(getWorkspaceEntries(ALL_OFF)).toEqual([
      "infra",
      "services/*",
      "dev-gateway",
      "packages/*",
    ]);
  });
});

// ---------------------------------------------------------------------------
// getWorkspaceEntries — conditional entries absent when flags are off
// ---------------------------------------------------------------------------

describe("getWorkspaceEntries — optional entries absent for minimal preset", () => {
  it("should not include 'frontend' when frontend is false", () => {
    expect(getWorkspaceEntries(ALL_OFF)).not.toContain("frontend");
  });

  it("should not include 'auth' when auth is false", () => {
    expect(getWorkspaceEntries(ALL_OFF)).not.toContain("auth");
  });

  it("should not include 'e2e' when e2e is false", () => {
    expect(getWorkspaceEntries(ALL_OFF)).not.toContain("e2e");
  });
});

// ---------------------------------------------------------------------------
// getWorkspaceEntries — standard preset
// ---------------------------------------------------------------------------

describe("getWorkspaceEntries — standard preset", () => {
  it("should return all core entries plus frontend, auth, e2e", () => {
    expect(getWorkspaceEntries(STANDARD)).toEqual([
      "infra",
      "services/*",
      "dev-gateway",
      "packages/*",
      "frontend",
      "auth",
      "e2e",
    ]);
  });

  it("should include 'frontend' for the standard preset", () => {
    expect(getWorkspaceEntries(STANDARD)).toContain("frontend");
  });

  it("should include 'auth' for the standard preset", () => {
    expect(getWorkspaceEntries(STANDARD)).toContain("auth");
  });

  it("should include 'e2e' for the standard preset", () => {
    expect(getWorkspaceEntries(STANDARD)).toContain("e2e");
  });
});

// ---------------------------------------------------------------------------
// getWorkspaceEntries — full preset
// ---------------------------------------------------------------------------

describe("getWorkspaceEntries — full preset", () => {
  it("should return all core entries plus frontend, auth, e2e for the full preset", () => {
    // database, cicd, monitoring, and hooks do not produce separate workspace
    // entries — they live inside existing workspace members.
    expect(getWorkspaceEntries(FULL)).toEqual([
      "infra",
      "services/*",
      "dev-gateway",
      "packages/*",
      "frontend",
      "auth",
      "e2e",
    ]);
  });
});

// ---------------------------------------------------------------------------
// getWorkspaceEntries — individual flags
// ---------------------------------------------------------------------------

describe("getWorkspaceEntries — individual flag behaviour", () => {
  it("should add 'frontend' only when frontend flag is true", () => {
    expect(getWorkspaceEntries({ ...ALL_OFF, frontend: true })).toContain("frontend");
    expect(getWorkspaceEntries({ ...ALL_OFF, frontend: false })).not.toContain("frontend");
  });

  it("should add 'auth' only when auth flag is true", () => {
    expect(getWorkspaceEntries({ ...ALL_OFF, auth: true })).toContain("auth");
    expect(getWorkspaceEntries({ ...ALL_OFF, auth: false })).not.toContain("auth");
  });

  it("should add 'e2e' only when e2e flag is true", () => {
    expect(getWorkspaceEntries({ ...ALL_OFF, e2e: true })).toContain("e2e");
    expect(getWorkspaceEntries({ ...ALL_OFF, e2e: false })).not.toContain("e2e");
  });

  it("should not add any extra entries for database, rds, cicd, monitoring, or hooks flags", () => {
    const allExtras: FeatureFlags = {
      ...ALL_OFF,
      database: true,
      rds: true,
      cicd: true,
      monitoring: true,
      hooks: true,
    };
    // Only the four core entries should be present — none of the above flags
    // produce workspace members.
    expect(getWorkspaceEntries(allExtras)).toEqual([
      "infra",
      "services/*",
      "dev-gateway",
      "packages/*",
    ]);
  });
});

// ---------------------------------------------------------------------------
// getWorkspaceEntries — return value isolation
// ---------------------------------------------------------------------------

describe("getWorkspaceEntries — return value isolation", () => {
  it("should return a new array on every call", () => {
    expect(getWorkspaceEntries(ALL_OFF)).not.toBe(getWorkspaceEntries(ALL_OFF));
  });

  it("should not be affected by mutation of the returned array", () => {
    const entries = getWorkspaceEntries(ALL_OFF);
    entries.push("injected");
    expect(getWorkspaceEntries(ALL_OFF)).toEqual([
      "infra",
      "services/*",
      "dev-gateway",
      "packages/*",
    ]);
  });
});
