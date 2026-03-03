import { describe, it, expect } from "vitest";
import {
  toPascalCase,
  toEntityName,
  toEntityNameLower,
  toFlatLower,
  getModuleVariableMap,
  injectBeforeMarker,
} from "../src/module-helpers.js";
import type { ModuleConfig } from "../src/types.js";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

/** Minimal valid ModuleConfig used to exercise getModuleVariableMap. */
function makeModuleConfig(overrides: Partial<ModuleConfig> = {}): ModuleConfig {
  return {
    moduleName: "order-items",
    entityName: "OrderItem",
    port: 3003,
    projectDir: "/home/user/my-app",
    projectName: "my-app",
    installDeps: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// toPascalCase
// ---------------------------------------------------------------------------

describe("toPascalCase", () => {
  describe("basic kebab-to-PascalCase conversion", () => {
    it("should convert a single-segment kebab string", () => {
      expect(toPascalCase("orders")).toBe("Orders");
    });

    it("should convert a two-segment kebab string", () => {
      expect(toPascalCase("order-items")).toBe("OrderItems");
    });

    it("should convert a three-segment kebab string", () => {
      expect(toPascalCase("my-order-items")).toBe("MyOrderItems");
    });

    it("should capitalize the first letter of each segment", () => {
      expect(toPascalCase("foo-bar-baz")).toBe("FooBarBaz");
    });
  });

  describe("already-uppercase inputs", () => {
    it("should leave an already-PascalCase word unchanged (no hyphens)", () => {
      expect(toPascalCase("Orders")).toBe("Orders");
    });

    it("should capitalize the first letter of each segment even when mixed case", () => {
      // Input: 'hello-WORLD' → segments ['hello', 'WORLD']
      // Each segment is uppercased at position 0 only; 'WORLD' stays 'WORLD'.
      expect(toPascalCase("hello-WORLD")).toBe("HelloWORLD");
    });
  });

  describe("edge cases", () => {
    it("should return an empty string for an empty input", () => {
      expect(toPascalCase("")).toBe("");
    });

    it("should handle a single character", () => {
      expect(toPascalCase("a")).toBe("A");
    });

    it("should handle a string with multiple consecutive hyphens", () => {
      // '--' splits into ['', '', ''] producing empty segment → no char to upper
      expect(toPascalCase("a--b")).toBe("AB");
    });

    it("should return the joined string without trailing hyphen artifacts", () => {
      expect(toPascalCase("users")).toBe("Users");
    });
  });
});

// ---------------------------------------------------------------------------
// toEntityName
// ---------------------------------------------------------------------------

describe("toEntityName", () => {
  describe("standard plurals — trailing 's' stripped", () => {
    it("should singularize 'orders' → 'Order'", () => {
      expect(toEntityName("orders")).toBe("Order");
    });

    it("should singularize 'order-items' → 'OrderItem'", () => {
      expect(toEntityName("order-items")).toBe("OrderItem");
    });

    it("should singularize 'users' → 'User'", () => {
      expect(toEntityName("users")).toBe("User");
    });

    it("should singularize 'products' → 'Product'", () => {
      expect(toEntityName("products")).toBe("Product");
    });
  });

  describe("'ss' ending — trailing 's' NOT stripped", () => {
    it("should preserve 'statuses' ends up as 'Status' (ses rule, not ss)", () => {
      // 'statuses' → PascalCase 'Statuses' → ends with 'ses' → slice(0,-2) → 'Status'
      expect(toEntityName("statuses")).toBe("Status");
    });

    it("should preserve 'class' (ends with 'ss') → 'Class'", () => {
      // 'class' → PascalCase 'Class' → ends with 'ss' → returned as is
      expect(toEntityName("class")).toBe("Class");
    });

    it("should preserve 'addresses' (ends with 'ses') → 'Address'", () => {
      // 'addresses' → 'Addresses' → ends with 'ses' → 'Addres' is wrong;
      // the rule is slice(0,-2) removing 'es' → 'Address'
      expect(toEntityName("addresses")).toBe("Address");
    });
  });

  describe("'ies' ending — replace with 'y'", () => {
    it("should singularize 'categories' → 'Category'", () => {
      expect(toEntityName("categories")).toBe("Category");
    });

    it("should singularize 'inventories' → 'Inventory'", () => {
      expect(toEntityName("inventories")).toBe("Inventory");
    });

    it("should singularize 'order-histories' → 'OrderHistory'", () => {
      expect(toEntityName("order-histories")).toBe("OrderHistory");
    });
  });

  describe("'ses'/'xes'/'zes' endings — strip trailing 'es'", () => {
    it("should singularize 'boxes' (xes) → 'Box'", () => {
      expect(toEntityName("boxes")).toBe("Box");
    });

    it("should singularize 'buzzes' (zes) → 'Buzz'", () => {
      expect(toEntityName("buzzes")).toBe("Buzz");
    });
  });

  describe("non-plural words — returned as PascalCase without modification", () => {
    it("should return 'Config' for 'config' (no trailing s)", () => {
      expect(toEntityName("config")).toBe("Config");
    });

    it("should return 'Auth' for 'auth' (no trailing s)", () => {
      expect(toEntityName("auth")).toBe("Auth");
    });
  });

  describe("edge cases", () => {
    it("should return an empty string for an empty input", () => {
      expect(toEntityName("")).toBe("");
    });

    it("should singularize a single-letter plural 'as' → 'A'", () => {
      // 'as' → PascalCase 'As' → ends with 's' but not 'ss'/'ies'/etc → 'A'
      expect(toEntityName("as")).toBe("A");
    });
  });
});

// ---------------------------------------------------------------------------
// toEntityNameLower
// ---------------------------------------------------------------------------

describe("toEntityNameLower", () => {
  describe("basic camelCase singular conversion", () => {
    it("should produce 'orderItem' for 'order-items'", () => {
      expect(toEntityNameLower("order-items")).toBe("orderItem");
    });

    it("should produce 'order' for 'orders'", () => {
      expect(toEntityNameLower("orders")).toBe("order");
    });

    it("should produce 'user' for 'users'", () => {
      expect(toEntityNameLower("users")).toBe("user");
    });

    it("should produce 'category' for 'categories'", () => {
      expect(toEntityNameLower("categories")).toBe("category");
    });

    it("should produce 'status' for 'statuses'", () => {
      expect(toEntityNameLower("statuses")).toBe("status");
    });
  });

  describe("first character lowercasing", () => {
    it("should lowercase the first character of the PascalCase entity name", () => {
      const result = toEntityNameLower("orders");
      expect(result.charAt(0)).toBe(result.charAt(0).toLowerCase());
    });

    it("should keep remaining characters unchanged", () => {
      // 'order-items' → 'OrderItem' → 'orderItem'
      expect(toEntityNameLower("order-items")).toBe("orderItem");
    });
  });

  describe("edge cases", () => {
    it("should return an empty string for an empty input", () => {
      expect(toEntityNameLower("")).toBe("");
    });

    it("should return 'config' for 'config'", () => {
      expect(toEntityNameLower("config")).toBe("config");
    });
  });
});

// ---------------------------------------------------------------------------
// toFlatLower
// ---------------------------------------------------------------------------

describe("toFlatLower", () => {
  describe("hyphen removal and lowercasing", () => {
    it("should remove hyphens and lowercase 'order-items' → 'orderitems'", () => {
      expect(toFlatLower("order-items")).toBe("orderitems");
    });

    it("should leave a single-word string unchanged (already lowercase)", () => {
      expect(toFlatLower("orders")).toBe("orders");
    });

    it("should remove multiple hyphens from 'my-order-items' → 'myorderitems'", () => {
      expect(toFlatLower("my-order-items")).toBe("myorderitems");
    });

    it("should lowercase an uppercase string", () => {
      expect(toFlatLower("ORDERS")).toBe("orders");
    });

    it("should both remove hyphens and lowercase a mixed input", () => {
      expect(toFlatLower("Order-Items")).toBe("orderitems");
    });
  });

  describe("edge cases", () => {
    it("should return an empty string for an empty input", () => {
      expect(toFlatLower("")).toBe("");
    });

    it("should handle a string that is only hyphens", () => {
      expect(toFlatLower("---")).toBe("");
    });

    it("should handle a string with no hyphens and already lowercase", () => {
      expect(toFlatLower("users")).toBe("users");
    });
  });
});

// ---------------------------------------------------------------------------
// getModuleVariableMap
// ---------------------------------------------------------------------------

describe("getModuleVariableMap", () => {
  describe("required keys in the returned map", () => {
    it("should include 'moduleName' in the returned map", () => {
      expect(getModuleVariableMap(makeModuleConfig())).toHaveProperty("moduleName");
    });

    it("should include 'ModuleName' (PascalCase) in the returned map", () => {
      expect(getModuleVariableMap(makeModuleConfig())).toHaveProperty("ModuleName");
    });

    it("should include 'entityName' in the returned map", () => {
      expect(getModuleVariableMap(makeModuleConfig())).toHaveProperty("entityName");
    });

    it("should include 'EntityName' in the returned map", () => {
      expect(getModuleVariableMap(makeModuleConfig())).toHaveProperty("EntityName");
    });

    it("should include 'entityNameLower' in the returned map", () => {
      expect(getModuleVariableMap(makeModuleConfig())).toHaveProperty("entityNameLower");
    });

    it("should include 'flatLower' in the returned map", () => {
      expect(getModuleVariableMap(makeModuleConfig())).toHaveProperty("flatLower");
    });

    it("should include 'port' in the returned map", () => {
      expect(getModuleVariableMap(makeModuleConfig())).toHaveProperty("port");
    });

    it("should include 'projectName' in the returned map", () => {
      expect(getModuleVariableMap(makeModuleConfig())).toHaveProperty("projectName");
    });

    it("should return exactly 21 keys", () => {
      expect(Object.keys(getModuleVariableMap(makeModuleConfig()))).toHaveLength(21);
    });

    it("should include 'authorizerSetup' in the returned map", () => {
      expect(getModuleVariableMap(makeModuleConfig())).toHaveProperty("authorizerSetup");
    });

    it("should include 'listAuthOptions' in the returned map", () => {
      expect(getModuleVariableMap(makeModuleConfig())).toHaveProperty("listAuthOptions");
    });

    it("should include 'getAuthOptions' in the returned map", () => {
      expect(getModuleVariableMap(makeModuleConfig())).toHaveProperty("getAuthOptions");
    });

    it("should include 'createAuthOptions' in the returned map", () => {
      expect(getModuleVariableMap(makeModuleConfig())).toHaveProperty("createAuthOptions");
    });

    it("should include 'updateAuthOptions' in the returned map", () => {
      expect(getModuleVariableMap(makeModuleConfig())).toHaveProperty("updateAuthOptions");
    });

    it("should include 'deleteAuthOptions' in the returned map", () => {
      expect(getModuleVariableMap(makeModuleConfig())).toHaveProperty("deleteAuthOptions");
    });
  });

  describe("correct values for 'order-items' config", () => {
    const config = makeModuleConfig({
      moduleName: "order-items",
      entityName: "OrderItem",
      port: 3003,
      projectName: "my-app",
    });

    it("should set moduleName to the raw kebab-case module name", () => {
      expect(getModuleVariableMap(config).moduleName).toBe("order-items");
    });

    it("should set ModuleName to the PascalCase of moduleName", () => {
      expect(getModuleVariableMap(config).ModuleName).toBe("OrderItems");
    });

    it("should set entityName to the config entityName", () => {
      expect(getModuleVariableMap(config).entityName).toBe("OrderItem");
    });

    it("should set EntityName to the same value as entityName", () => {
      expect(getModuleVariableMap(config).EntityName).toBe("OrderItem");
    });

    it("should set entityNameLower to camelCase of entityName", () => {
      expect(getModuleVariableMap(config).entityNameLower).toBe("orderItem");
    });

    it("should set flatLower to the hyphen-free lowercase moduleName", () => {
      expect(getModuleVariableMap(config).flatLower).toBe("orderitems");
    });

    it("should set port to the string representation of the numeric port", () => {
      expect(getModuleVariableMap(config).port).toBe("3003");
    });

    it("should set projectName to the config projectName", () => {
      expect(getModuleVariableMap(config).projectName).toBe("my-app");
    });
  });

  describe("correct values for 'users' config", () => {
    const config = makeModuleConfig({
      moduleName: "users",
      entityName: "User",
      port: 3001,
      projectName: "cool-api",
    });

    it("should set moduleName to 'users'", () => {
      expect(getModuleVariableMap(config).moduleName).toBe("users");
    });

    it("should set ModuleName to 'Users'", () => {
      expect(getModuleVariableMap(config).ModuleName).toBe("Users");
    });

    it("should set entityNameLower to 'user'", () => {
      expect(getModuleVariableMap(config).entityNameLower).toBe("user");
    });

    it("should set flatLower to 'users' (no hyphens)", () => {
      expect(getModuleVariableMap(config).flatLower).toBe("users");
    });

    it("should set port to '3001'", () => {
      expect(getModuleVariableMap(config).port).toBe("3001");
    });

    it("should set projectName to 'cool-api'", () => {
      expect(getModuleVariableMap(config).projectName).toBe("cool-api");
    });
  });

  describe("all returned values are strings", () => {
    it("should return only string values", () => {
      const map = getModuleVariableMap(makeModuleConfig());
      for (const value of Object.values(map)) {
        expect(typeof value).toBe("string");
      }
    });
  });

  describe("return value isolation", () => {
    it("should return a new object on every call", () => {
      const config = makeModuleConfig();
      expect(getModuleVariableMap(config)).not.toBe(getModuleVariableMap(config));
    });

    it("should not be affected by mutation of the returned map", () => {
      const config = makeModuleConfig({ moduleName: "orders", entityName: "Order" });
      const map = getModuleVariableMap(config);
      (map as Record<string, string>)["injected"] = "value";
      expect(getModuleVariableMap(config)).not.toHaveProperty("injected");
    });
  });

  // -------------------------------------------------------------------------
  // Auth variables — protectedEndpoints is absent (fully unprotected module)
  // -------------------------------------------------------------------------

  describe("auth variables when protectedEndpoints is undefined", () => {
    it("should set authorizerSetup to an empty string when protectedEndpoints is absent", () => {
      const map = getModuleVariableMap(makeModuleConfig());
      expect(map.authorizerSetup).toBe("");
    });

    it("should set listAuthOptions to an empty string when protectedEndpoints is absent", () => {
      const map = getModuleVariableMap(makeModuleConfig());
      expect(map.listAuthOptions).toBe("");
    });

    it("should set getAuthOptions to an empty string when protectedEndpoints is absent", () => {
      const map = getModuleVariableMap(makeModuleConfig());
      expect(map.getAuthOptions).toBe("");
    });

    it("should set createAuthOptions to an empty string when protectedEndpoints is absent", () => {
      const map = getModuleVariableMap(makeModuleConfig());
      expect(map.createAuthOptions).toBe("");
    });

    it("should set updateAuthOptions to an empty string when protectedEndpoints is absent", () => {
      const map = getModuleVariableMap(makeModuleConfig());
      expect(map.updateAuthOptions).toBe("");
    });

    it("should set deleteAuthOptions to an empty string when protectedEndpoints is absent", () => {
      const map = getModuleVariableMap(makeModuleConfig());
      expect(map.deleteAuthOptions).toBe("");
    });
  });

  describe("auth variables when all protectedEndpoints flags are false", () => {
    const config = makeModuleConfig({
      protectedEndpoints: { list: false, get: false, create: false, update: false, delete: false },
    });

    it("should set authorizerSetup to an empty string when all endpoints are unprotected", () => {
      expect(getModuleVariableMap(config).authorizerSetup).toBe("");
    });

    it("should set all per-method auth options to empty strings when all flags are false", () => {
      const map = getModuleVariableMap(config);
      expect(map.listAuthOptions).toBe("");
      expect(map.getAuthOptions).toBe("");
      expect(map.createAuthOptions).toBe("");
      expect(map.updateAuthOptions).toBe("");
      expect(map.deleteAuthOptions).toBe("");
    });
  });

  // -------------------------------------------------------------------------
  // Auth variables — some endpoints are protected
  // -------------------------------------------------------------------------

  describe("auth variables when some endpoints are protected", () => {
    const config = makeModuleConfig({
      protectedEndpoints: { list: false, get: false, create: true, update: true, delete: true },
    });

    it("should produce a non-empty authorizerSetup when at least one endpoint is protected", () => {
      expect(getModuleVariableMap(config).authorizerSetup).not.toBe("");
    });

    it("should set listAuthOptions to empty string for an unprotected list endpoint", () => {
      expect(getModuleVariableMap(config).listAuthOptions).toBe("");
    });

    it("should set getAuthOptions to empty string for an unprotected get endpoint", () => {
      expect(getModuleVariableMap(config).getAuthOptions).toBe("");
    });

    it("should set createAuthOptions to a non-empty string for a protected create endpoint", () => {
      expect(getModuleVariableMap(config).createAuthOptions).not.toBe("");
    });

    it("should set updateAuthOptions to a non-empty string for a protected update endpoint", () => {
      expect(getModuleVariableMap(config).updateAuthOptions).not.toBe("");
    });

    it("should set deleteAuthOptions to a non-empty string for a protected delete endpoint", () => {
      expect(getModuleVariableMap(config).deleteAuthOptions).not.toBe("");
    });

    it("should produce the same auth options string for every protected method", () => {
      const map = getModuleVariableMap(config);
      // All three protected methods receive the same CDK options snippet.
      expect(map.createAuthOptions).toBe(map.updateAuthOptions);
      expect(map.updateAuthOptions).toBe(map.deleteAuthOptions);
    });
  });

  // -------------------------------------------------------------------------
  // Auth variables — all endpoints are protected
  // -------------------------------------------------------------------------

  describe("auth variables when all endpoints are protected", () => {
    const config = makeModuleConfig({
      protectedEndpoints: { list: true, get: true, create: true, update: true, delete: true },
    });

    it("should produce a non-empty authorizerSetup when all endpoints are protected", () => {
      expect(getModuleVariableMap(config).authorizerSetup).not.toBe("");
    });

    it("should produce non-empty auth options for every method when all are protected", () => {
      const map = getModuleVariableMap(config);
      expect(map.listAuthOptions).not.toBe("");
      expect(map.getAuthOptions).not.toBe("");
      expect(map.createAuthOptions).not.toBe("");
      expect(map.updateAuthOptions).not.toBe("");
      expect(map.deleteAuthOptions).not.toBe("");
    });
  });

  // -------------------------------------------------------------------------
  // authorizerSetup content — expected CDK constructs
  // -------------------------------------------------------------------------

  describe("authorizerSetup content", () => {
    const config = makeModuleConfig({
      protectedEndpoints: { list: true, get: false, create: false, update: false, delete: false },
    });

    it("should contain 'TokenAuthorizer' in authorizerSetup", () => {
      expect(getModuleVariableMap(config).authorizerSetup).toContain("TokenAuthorizer");
    });

    it("should contain 'importValue' in authorizerSetup", () => {
      expect(getModuleVariableMap(config).authorizerSetup).toContain("importValue");
    });

    it("should contain the {{projectName}} placeholder in authorizerSetup", () => {
      expect(getModuleVariableMap(config).authorizerSetup).toContain("{{projectName}}");
    });

    it("should contain the {{ModuleName}} placeholder in authorizerSetup", () => {
      expect(getModuleVariableMap(config).authorizerSetup).toContain("{{ModuleName}}");
    });

    it("should contain 'identitySource' in authorizerSetup", () => {
      expect(getModuleVariableMap(config).authorizerSetup).toContain("identitySource");
    });

    it("should reference the Authorization header in authorizerSetup", () => {
      expect(getModuleVariableMap(config).authorizerSetup).toContain("Authorization");
    });
  });

  // -------------------------------------------------------------------------
  // Per-method auth options content
  // -------------------------------------------------------------------------

  describe("per-method auth options content", () => {
    const config = makeModuleConfig({
      protectedEndpoints: { list: true, get: false, create: false, update: false, delete: false },
    });

    it("should include 'authorizer' reference in a protected method's options string", () => {
      expect(getModuleVariableMap(config).listAuthOptions).toContain("authorizer");
    });

    it("should include 'authorizationType' in a protected method's options string", () => {
      expect(getModuleVariableMap(config).listAuthOptions).toContain("authorizationType");
    });

    it("should reference CUSTOM authorization type in a protected method's options string", () => {
      expect(getModuleVariableMap(config).listAuthOptions).toContain("CUSTOM");
    });

    it("should start the options string with a leading comma to fit inside addMethod() call", () => {
      // The snippet is appended directly inside a method call, so it must begin with ', {'
      expect(getModuleVariableMap(config).listAuthOptions.trimStart()).toMatch(/^,/);
    });
  });

  // -------------------------------------------------------------------------
  // localAuth middleware variables — Phase 2 of silver-gate
  // -------------------------------------------------------------------------

  describe("localAuth middleware variables", () => {
    // -----------------------------------------------------------------------
    // 1. All unprotected — no protectedEndpoints in config
    // -----------------------------------------------------------------------

    describe("when protectedEndpoints is absent (all unprotected)", () => {
      const map = getModuleVariableMap(makeModuleConfig());

      it("should set localAuthImport to an empty string", () => {
        expect(map.localAuthImport).toBe("");
      });

      it("should set localAuthConst to an empty string", () => {
        expect(map.localAuthConst).toBe("");
      });

      it("should set createAuthMiddleware to an empty string", () => {
        expect(map.createAuthMiddleware).toBe("");
      });

      it("should set getAuthMiddleware to an empty string", () => {
        expect(map.getAuthMiddleware).toBe("");
      });

      it("should set listAuthMiddleware to an empty string", () => {
        expect(map.listAuthMiddleware).toBe("");
      });

      it("should set updateAuthMiddleware to an empty string", () => {
        expect(map.updateAuthMiddleware).toBe("");
      });

      it("should set deleteAuthMiddleware to an empty string", () => {
        expect(map.deleteAuthMiddleware).toBe("");
      });
    });

    // -----------------------------------------------------------------------
    // 2. All protected — every endpoint flag is true
    // -----------------------------------------------------------------------

    describe("when all protectedEndpoints flags are true", () => {
      const config = makeModuleConfig({
        protectedEndpoints: { list: true, get: true, create: true, update: true, delete: true },
      });
      const map = getModuleVariableMap(config);

      it("should set localAuthImport to the import statement containing {{projectName}}", () => {
        expect(map.localAuthImport).toContain("{{projectName}}");
      });

      it("should set localAuthImport to include the localAuth named import", () => {
        expect(map.localAuthImport).toContain("localAuth");
      });

      it("should set localAuthImport to include the lambda-utils package reference", () => {
        expect(map.localAuthImport).toContain("lambda-utils");
      });

      it("should set localAuthConst to the auth constant assignment", () => {
        expect(map.localAuthConst).toContain("const auth = localAuth();");
      });

      it("should set createAuthMiddleware to 'auth, '", () => {
        expect(map.createAuthMiddleware).toBe("auth, ");
      });

      it("should set getAuthMiddleware to 'auth, '", () => {
        expect(map.getAuthMiddleware).toBe("auth, ");
      });

      it("should set listAuthMiddleware to 'auth, '", () => {
        expect(map.listAuthMiddleware).toBe("auth, ");
      });

      it("should set updateAuthMiddleware to 'auth, '", () => {
        expect(map.updateAuthMiddleware).toBe("auth, ");
      });

      it("should set deleteAuthMiddleware to 'auth, '", () => {
        expect(map.deleteAuthMiddleware).toBe("auth, ");
      });
    });

    // -----------------------------------------------------------------------
    // 3. Partial protection — only create and delete are protected
    // -----------------------------------------------------------------------

    describe("when only create and delete endpoints are protected", () => {
      const config = makeModuleConfig({
        protectedEndpoints: { list: false, get: false, create: true, update: false, delete: true },
      });
      const map = getModuleVariableMap(config);

      it("should set createAuthMiddleware to 'auth, ' for a protected create endpoint", () => {
        expect(map.createAuthMiddleware).toBe("auth, ");
      });

      it("should set deleteAuthMiddleware to 'auth, ' for a protected delete endpoint", () => {
        expect(map.deleteAuthMiddleware).toBe("auth, ");
      });

      it("should set listAuthMiddleware to '' for an unprotected list endpoint", () => {
        expect(map.listAuthMiddleware).toBe("");
      });

      it("should set getAuthMiddleware to '' for an unprotected get endpoint", () => {
        expect(map.getAuthMiddleware).toBe("");
      });

      it("should set updateAuthMiddleware to '' for an unprotected update endpoint", () => {
        expect(map.updateAuthMiddleware).toBe("");
      });

      it("should still populate localAuthImport when at least one endpoint is protected", () => {
        expect(map.localAuthImport).not.toBe("");
      });

      it("should still populate localAuthConst when at least one endpoint is protected", () => {
        expect(map.localAuthConst).not.toBe("");
      });
    });

    // -----------------------------------------------------------------------
    // 4. Single endpoint protected — only list
    // -----------------------------------------------------------------------

    describe("when only the list endpoint is protected", () => {
      const config = makeModuleConfig({
        protectedEndpoints: { list: true, get: false, create: false, update: false, delete: false },
      });
      const map = getModuleVariableMap(config);

      it("should populate localAuthImport when only list is protected", () => {
        expect(map.localAuthImport).not.toBe("");
      });

      it("should populate localAuthConst when only list is protected", () => {
        expect(map.localAuthConst).not.toBe("");
      });

      it("should set listAuthMiddleware to 'auth, ' for the protected list endpoint", () => {
        expect(map.listAuthMiddleware).toBe("auth, ");
      });

      it("should set getAuthMiddleware to '' when get is not protected", () => {
        expect(map.getAuthMiddleware).toBe("");
      });

      it("should set createAuthMiddleware to '' when create is not protected", () => {
        expect(map.createAuthMiddleware).toBe("");
      });

      it("should set updateAuthMiddleware to '' when update is not protected", () => {
        expect(map.updateAuthMiddleware).toBe("");
      });

      it("should set deleteAuthMiddleware to '' when delete is not protected", () => {
        expect(map.deleteAuthMiddleware).toBe("");
      });
    });

    // -----------------------------------------------------------------------
    // 5. Variable ordering — localAuthImport appears before projectName
    // -----------------------------------------------------------------------

    describe("variable key ordering", () => {
      it("should place localAuthImport before projectName in Object.keys()", () => {
        const keys = Object.keys(getModuleVariableMap(makeModuleConfig()));
        const localAuthImportIdx = keys.indexOf("localAuthImport");
        const projectNameIdx = keys.indexOf("projectName");
        expect(localAuthImportIdx).toBeGreaterThanOrEqual(0);
        expect(projectNameIdx).toBeGreaterThanOrEqual(0);
        expect(localAuthImportIdx).toBeLessThan(projectNameIdx);
      });

      it("should place localAuthConst before projectName in Object.keys()", () => {
        const keys = Object.keys(getModuleVariableMap(makeModuleConfig()));
        const localAuthConstIdx = keys.indexOf("localAuthConst");
        const projectNameIdx = keys.indexOf("projectName");
        expect(localAuthConstIdx).toBeLessThan(projectNameIdx);
      });

      it("should include all 7 new auth middleware keys in the returned map", () => {
        const map = getModuleVariableMap(makeModuleConfig());
        expect(map).toHaveProperty("localAuthImport");
        expect(map).toHaveProperty("localAuthConst");
        expect(map).toHaveProperty("createAuthMiddleware");
        expect(map).toHaveProperty("getAuthMiddleware");
        expect(map).toHaveProperty("listAuthMiddleware");
        expect(map).toHaveProperty("updateAuthMiddleware");
        expect(map).toHaveProperty("deleteAuthMiddleware");
      });
    });

    // -----------------------------------------------------------------------
    // localAuthImport content — exact shape
    // -----------------------------------------------------------------------

    describe("localAuthImport content when any endpoint is protected", () => {
      const config = makeModuleConfig({
        protectedEndpoints: { list: false, get: false, create: true, update: false, delete: false },
      });
      const map = getModuleVariableMap(config);

      it("should begin with a newline so it appends cleanly to surrounding imports", () => {
        expect(map.localAuthImport.startsWith("\n")).toBe(true);
      });

      it("should use a named import of localAuth", () => {
        expect(map.localAuthImport).toContain("{ localAuth }");
      });

      it("should import from the scoped lambda-utils package using @{{projectName}} scope", () => {
        expect(map.localAuthImport).toContain("@{{projectName}}/lambda-utils");
      });
    });

    // -----------------------------------------------------------------------
    // localAuthConst content — exact shape
    // -----------------------------------------------------------------------

    describe("localAuthConst content when any endpoint is protected", () => {
      const config = makeModuleConfig({
        protectedEndpoints: { list: false, get: true, create: false, update: false, delete: false },
      });
      const map = getModuleVariableMap(config);

      it("should begin with a newline", () => {
        expect(map.localAuthConst.startsWith("\n")).toBe(true);
      });

      it("should call localAuth() with no arguments", () => {
        expect(map.localAuthConst).toContain("localAuth()");
      });

      it("should assign the result to a const named auth", () => {
        expect(map.localAuthConst).toContain("const auth");
      });

      it("should not end with a trailing newline", () => {
        expect(map.localAuthConst.endsWith("\n")).toBe(false);
      });
    });

    // -----------------------------------------------------------------------
    // All-false protectedEndpoints — same as absent
    // -----------------------------------------------------------------------

    describe("when all protectedEndpoints flags are explicitly false", () => {
      const config = makeModuleConfig({
        protectedEndpoints: { list: false, get: false, create: false, update: false, delete: false },
      });
      const map = getModuleVariableMap(config);

      it("should set localAuthImport to '' when all flags are false", () => {
        expect(map.localAuthImport).toBe("");
      });

      it("should set localAuthConst to '' when all flags are false", () => {
        expect(map.localAuthConst).toBe("");
      });

      it("should set all middleware vars to '' when all flags are false", () => {
        expect(map.createAuthMiddleware).toBe("");
        expect(map.getAuthMiddleware).toBe("");
        expect(map.listAuthMiddleware).toBe("");
        expect(map.updateAuthMiddleware).toBe("");
        expect(map.deleteAuthMiddleware).toBe("");
      });
    });
  });
});

// ---------------------------------------------------------------------------
// injectBeforeMarker
// ---------------------------------------------------------------------------

describe("injectBeforeMarker", () => {
  describe("basic insertion", () => {
    it("should insert the new line immediately before the marker line", () => {
      const content = "const routes = [\n  // @inject:routes\n];\n";
      const result = injectBeforeMarker(
        content,
        "// @inject:routes",
        "  { path: '/orders', handler: ordersHandler },"
      );
      const lines = result.split("\n");
      const markerIdx = lines.findIndex((l) => l.includes("// @inject:routes"));
      expect(lines[markerIdx - 1]).toBe("  { path: '/orders', handler: ordersHandler },");
    });

    it("should leave the marker line intact in the output", () => {
      const content = "const routes = [\n  // @inject:routes\n];\n";
      const result = injectBeforeMarker(content, "// @inject:routes", "  newLine,");
      expect(result).toContain("// @inject:routes");
    });

    it("should return a string with one more line than the input", () => {
      const content = "line one\n// @inject:here\nline three\n";
      const result = injectBeforeMarker(content, "// @inject:here", "inserted line");
      const inputLines = content.split("\n");
      const outputLines = result.split("\n");
      expect(outputLines).toHaveLength(inputLines.length + 1);
    });

    it("should not modify lines that are not adjacent to the marker", () => {
      const content = "first line\n// @inject:marker\nlast line\n";
      const result = injectBeforeMarker(content, "// @inject:marker", "new line");
      expect(result).toContain("first line");
      expect(result).toContain("last line");
    });
  });

  describe("indentation inheritance from marker line", () => {
    it("should apply the marker's leading whitespace to the inserted line", () => {
      const content = "[\n  // @inject:routes\n]\n";
      const result = injectBeforeMarker(content, "// @inject:routes", "{ path: '/a' },");
      const lines = result.split("\n");
      const insertedIdx = lines.findIndex((l) => l.includes("{ path: '/a' }"));
      // The marker has 2-space indent; inserted line should also have 2-space indent.
      expect(lines[insertedIdx]).toBe("  { path: '/a' },");
    });

    it("should strip leading whitespace from newLine before applying marker indentation", () => {
      const content = "[\n    // @inject:routes\n]\n";
      // newLine has its own (different) leading spaces that should be replaced by marker indent.
      const result = injectBeforeMarker(content, "// @inject:routes", "  item,");
      const lines = result.split("\n");
      const insertedIdx = lines.findIndex((l) => l.includes("item,"));
      // Marker has 4 spaces; trimStart of '  item,' is 'item,'; result: '    item,'
      expect(lines[insertedIdx]).toBe("    item,");
    });

    it("should handle a top-level (zero-indent) marker", () => {
      const content = "// @inject:imports\nconst x = 1;\n";
      const result = injectBeforeMarker(content, "// @inject:imports", "import { foo } from './foo';");
      const lines = result.split("\n");
      // Marker has no leading whitespace, so inserted line should start at column 0.
      expect(lines[0]).toBe("import { foo } from './foo';");
    });

    it("should handle tab-indented marker lines", () => {
      const content = "[\n\t// @inject:items\n]\n";
      const result = injectBeforeMarker(content, "// @inject:items", "item,");
      const lines = result.split("\n");
      const insertedIdx = lines.findIndex((l) => l.includes("item,"));
      expect(lines[insertedIdx]).toBe("\titem,");
    });
  });

  describe("multiple injections into the same content", () => {
    it("should allow injecting twice using the same marker (marker survives each call)", () => {
      const initial = "const a = [\n  // @inject:items\n];\n";
      const after1 = injectBeforeMarker(initial, "// @inject:items", "  'first',");
      const after2 = injectBeforeMarker(after1, "// @inject:items", "  'second',");

      expect(after2).toContain("'first',");
      expect(after2).toContain("'second',");
      expect(after2).toContain("// @inject:items");
    });

    it("should accumulate injections in reverse insertion order before the marker", () => {
      const initial = "[\n  // @inject:list\n]\n";
      const after1 = injectBeforeMarker(initial, "// @inject:list", "  'a',");
      const after2 = injectBeforeMarker(after1, "// @inject:list", "  'b',");

      const lines = after2.split("\n");
      const markerIdx = lines.findIndex((l) => l.includes("// @inject:list"));
      // Most recently injected ('b') appears just before marker; 'a' appears before that.
      expect(lines[markerIdx - 1]).toBe("  'b',");
      expect(lines[markerIdx - 2]).toBe("  'a',");
    });
  });

  describe("marker not found — throws", () => {
    it("should throw when the marker is not present in content", () => {
      const content = "const x = 1;\nconst y = 2;\n";
      expect(() =>
        injectBeforeMarker(content, "// @inject:missing", "new line")
      ).toThrow();
    });

    it("should throw an error mentioning the missing marker", () => {
      const content = "no marker here\n";
      expect(() =>
        injectBeforeMarker(content, "// @inject:absent", "new line")
      ).toThrow(/absent/);
    });

    it("should throw an Error instance (not a string or other type)", () => {
      const content = "line\n";
      let thrown: unknown;
      try {
        injectBeforeMarker(content, "NOT_PRESENT", "x");
      } catch (e) {
        thrown = e;
      }
      expect(thrown).toBeInstanceOf(Error);
    });
  });

  describe("edge cases", () => {
    it("should handle a marker that appears at the very first line", () => {
      const content = "// @inject:top\nrest of content\n";
      const result = injectBeforeMarker(content, "// @inject:top", "inserted");
      const lines = result.split("\n");
      expect(lines[0]).toBe("inserted");
      expect(lines[1]).toBe("// @inject:top");
    });

    it("should handle a marker at the last line (no trailing newline)", () => {
      const content = "before\n// @inject:bottom";
      const result = injectBeforeMarker(content, "// @inject:bottom", "mid");
      expect(result).toContain("mid");
      expect(result).toContain("// @inject:bottom");
    });

    it("should handle an empty newLine string", () => {
      const content = "a\n// @inject:mark\nb\n";
      // Empty string after trimStart is still empty; marker indent applied → just whitespace.
      const result = injectBeforeMarker(content, "// @inject:mark", "");
      expect(result).toContain("// @inject:mark");
    });

    it("should handle content with only the marker line", () => {
      const content = "// @inject:only";
      const result = injectBeforeMarker(content, "// @inject:only", "new");
      const lines = result.split("\n");
      expect(lines[0]).toBe("new");
      expect(lines[1]).toBe("// @inject:only");
    });
  });
});
