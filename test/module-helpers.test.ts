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

    it("should return exactly 8 keys", () => {
      expect(Object.keys(getModuleVariableMap(makeModuleConfig()))).toHaveLength(8);
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
