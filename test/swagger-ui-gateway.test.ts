/**
 * Swagger UI gateway template tests.
 *
 * This file has NO module mocks so it can hit the real filesystem.
 * It validates the content of:
 *
 *   templates/dev-gateway/src/gateway.ts
 *
 * Which was extended in the api-document phase to add:
 *   - getMergedOpenApiSpec() — scans ../services/<service>/dist/openapi.json and merges
 *     paths + schemas with conflict-aware prefixing and $ref rewriting
 *   - SWAGGER_UI_HTML — static HTML for Swagger UI loaded from CDN
 *   - Route handler for GET /docs/openapi.json (JSON spec endpoint)
 *   - Route handler for GET /docs (Swagger UI HTML endpoint)
 *
 * Because gateway.ts is a template file that ships verbatim into generated
 * projects (it has no .hbs suffix — it is a static template), the tests
 * validate structural content as strings rather than executing the code.
 *
 * What is NOT tested here:
 *   - Runtime behaviour of getMergedOpenApiSpec()   → must run inside a generated project
 *   - scaffold() orchestration                      → test/scaffolder.test.ts
 *   - File existence of dev-gateway/                → test/phase4-templates.test.ts
 *   - Proxy routing logic (resolveUpstream)         → covered by existing gateway structure tests
 */

import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Template root resolution
// ---------------------------------------------------------------------------

/**
 * Absolute path to templates/ at the repository root.
 * Uses fileURLToPath + dirname to be ESM-safe and work correctly regardless
 * of the working directory at test-run time.
 *
 * Layout:
 *   test/swagger-ui-gateway.test.ts  →  dirname = <root>/test
 *   templates/                       →  resolve(<root>/test, "..", "templates")
 */
const TEMPLATE_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "templates"
);

const GATEWAY_FILE = join(TEMPLATE_ROOT, "dev-gateway", "src", "gateway.ts");

// ---------------------------------------------------------------------------
// Shared content — read the file once per suite run.
// ---------------------------------------------------------------------------

async function readGateway(): Promise<string> {
  return readFile(GATEWAY_FILE, "utf8");
}

// ===========================================================================
// PART 1: /docs/openapi.json handler
// ===========================================================================

describe("gateway.ts — GET /docs/openapi.json handler", () => {
  it("contains a handler for url === '/docs/openapi.json'", async () => {
    const raw = await readGateway();
    expect(raw).toContain('url === "/docs/openapi.json"');
  });

  it("responds with 200 and Content-Type application/json", async () => {
    const raw = await readGateway();
    expect(raw).toContain('"Content-Type": "application/json"');
    // The 200 status must be associated with the openapi.json handler block.
    const handlerIdx = raw.indexOf('url === "/docs/openapi.json"');
    const handlerBlock = raw.slice(handlerIdx, handlerIdx + 400);
    expect(handlerBlock).toContain("200");
  });

  it("calls getMergedOpenApiSpec() inside the handler", async () => {
    const raw = await readGateway();
    // Verify the call exists after the url check so it is part of the handler
    const handlerIdx = raw.indexOf('url === "/docs/openapi.json"');
    const handlerBlock = raw.slice(handlerIdx, handlerIdx + 300);
    expect(handlerBlock).toContain("getMergedOpenApiSpec()");
  });

  it("has a try/catch block in the /docs/openapi.json handler for graceful error handling", async () => {
    const raw = await readGateway();
    // The handler block should contain both try and catch
    const handlerStart = raw.indexOf('url === "/docs/openapi.json"');
    const handlerEnd = raw.indexOf("return;", handlerStart);
    const handlerBlock = raw.slice(handlerStart, handlerEnd + 7);
    expect(handlerBlock).toContain("try {");
    expect(handlerBlock).toContain("catch");
  });

  it("returns 500 with INTERNAL_ERROR on spec generation failure", async () => {
    const raw = await readGateway();
    expect(raw).toContain('error: "INTERNAL_ERROR"');
    expect(raw).toContain("500");
  });

  it("serializes the spec with JSON.stringify and pretty-print indent", async () => {
    const raw = await readGateway();
    // Pretty-printing (null, 2) is important so browsers can inspect the spec
    expect(raw).toContain("JSON.stringify(spec, null, 2)");
  });
});

// ===========================================================================
// PART 2: /docs handler (Swagger UI)
// ===========================================================================

describe("gateway.ts — GET /docs handler", () => {
  it("contains a handler for url === '/docs'", async () => {
    const raw = await readGateway();
    expect(raw).toContain('url === "/docs"');
  });

  it("responds with 200 and Content-Type text/html; charset=utf-8", async () => {
    const raw = await readGateway();
    expect(raw).toContain('"Content-Type": "text/html; charset=utf-8"');
  });

  it("sends SWAGGER_UI_HTML as the response body", async () => {
    const raw = await readGateway();
    const handlerIdx = raw.indexOf('url === "/docs"');
    const handlerBlock = raw.slice(handlerIdx, handlerIdx + 300);
    expect(handlerBlock).toContain("SWAGGER_UI_HTML");
  });
});

// ===========================================================================
// PART 3: Documentation routes are placed before proxy logic
// ===========================================================================

describe("gateway.ts — documentation routes precede proxy logic", () => {
  it("/docs/openapi.json handler appears before resolveUpstream call", async () => {
    const raw = await readGateway();
    const docsJsonIdx = raw.indexOf('url === "/docs/openapi.json"');
    const resolveUpstreamIdx = raw.indexOf("resolveUpstream(url)");
    expect(docsJsonIdx).toBeGreaterThan(-1);
    expect(resolveUpstreamIdx).toBeGreaterThan(-1);
    expect(docsJsonIdx).toBeLessThan(resolveUpstreamIdx);
  });

  it("/docs handler appears before resolveUpstream call", async () => {
    const raw = await readGateway();
    const docsIdx = raw.indexOf('url === "/docs"');
    const resolveUpstreamIdx = raw.indexOf("resolveUpstream(url)");
    expect(docsIdx).toBeGreaterThan(-1);
    expect(resolveUpstreamIdx).toBeGreaterThan(-1);
    expect(docsIdx).toBeLessThan(resolveUpstreamIdx);
  });

  it("/docs/openapi.json handler appears before /docs handler", async () => {
    const raw = await readGateway();
    // More specific path must be checked before less specific path to avoid
    // false matches on the /docs prefix.
    const docsJsonIdx = raw.indexOf('url === "/docs/openapi.json"');
    const docsIdx = raw.indexOf('url === "/docs"');
    expect(docsJsonIdx).toBeLessThan(docsIdx);
  });

  it("each documentation route ends with an early return statement", async () => {
    const raw = await readGateway();
    // Both handlers must return before falling through to the proxy logic.
    // We verify by counting return statements in the documentation section.
    const docsSectionStart = raw.indexOf("Built-in documentation endpoints");
    const docsSectionEnd = raw.indexOf("resolveUpstream(url)");
    const docsSection = raw.slice(docsSectionStart, docsSectionEnd);
    const returnCount = (docsSection.match(/\breturn;/g) ?? []).length;
    // Two documentation routes → at minimum two return statements.
    expect(returnCount).toBeGreaterThanOrEqual(2);
  });
});

// ===========================================================================
// PART 4: SWAGGER_UI_HTML constant
// ===========================================================================

describe("gateway.ts — SWAGGER_UI_HTML constant", () => {
  it("defines SWAGGER_UI_HTML as a const string", async () => {
    const raw = await readGateway();
    expect(raw).toContain("const SWAGGER_UI_HTML");
  });

  it("references swagger-ui.css from unpkg.com/swagger-ui-dist@5", async () => {
    const raw = await readGateway();
    expect(raw).toContain("https://unpkg.com/swagger-ui-dist@5/swagger-ui.css");
  });

  it("references swagger-ui-bundle.js from unpkg.com/swagger-ui-dist@5", async () => {
    const raw = await readGateway();
    expect(raw).toContain(
      "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"
    );
  });

  it("references swagger-ui-standalone-preset.js from unpkg.com/swagger-ui-dist@5", async () => {
    const raw = await readGateway();
    expect(raw).toContain(
      "https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"
    );
  });

  it("initialises SwaggerUIBundle with url pointing to /docs/openapi.json", async () => {
    const raw = await readGateway();
    expect(raw).toContain('url: "/docs/openapi.json"');
  });

  it("sets dom_id to #swagger-ui", async () => {
    const raw = await readGateway();
    expect(raw).toContain('dom_id: "#swagger-ui"');
  });

  it("includes a div with id swagger-ui as the mount point", async () => {
    const raw = await readGateway();
    expect(raw).toContain('<div id="swagger-ui">');
  });

  it("enables deepLinking in SwaggerUIBundle config", async () => {
    const raw = await readGateway();
    expect(raw).toContain("deepLinking: true");
  });

  it("uses StandaloneLayout for the Swagger UI layout", async () => {
    const raw = await readGateway();
    expect(raw).toContain('layout: "StandaloneLayout"');
  });

  it("includes SwaggerUIStandalonePreset in the presets array", async () => {
    const raw = await readGateway();
    expect(raw).toContain("SwaggerUIStandalonePreset");
  });
});

// ===========================================================================
// PART 5: getMergedOpenApiSpec function
// ===========================================================================

describe("gateway.ts — getMergedOpenApiSpec function declaration", () => {
  it("declares getMergedOpenApiSpec as a function", async () => {
    const raw = await readGateway();
    expect(raw).toContain("function getMergedOpenApiSpec()");
  });

  it("returns an object with openapi version field set to '3.1.0'", async () => {
    const raw = await readGateway();
    expect(raw).toContain('"3.1.0"');
    // The string must be inside getMergedOpenApiSpec return value
    const fnStart = raw.indexOf("function getMergedOpenApiSpec()");
    const fnEnd = raw.indexOf("\nfunction ", fnStart + 1);
    const fnBody = raw.slice(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    expect(fnBody).toContain('"3.1.0"');
    expect(fnBody).toContain("openapi:");
  });

  it("builds merged result with paths and components.schemas fields", async () => {
    const raw = await readGateway();
    const fnStart = raw.indexOf("function getMergedOpenApiSpec()");
    const fnEnd = raw.indexOf("\nfunction ", fnStart + 1);
    const fnBody = raw.slice(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    expect(fnBody).toContain("mergedPaths");
    expect(fnBody).toContain("mergedSchemas");
    expect(fnBody).toContain("paths:");
    expect(fnBody).toContain("components:");
    expect(fnBody).toContain("schemas:");
  });

  it("resolves services directory relative to __dirname", async () => {
    const raw = await readGateway();
    const fnStart = raw.indexOf("function getMergedOpenApiSpec()");
    const fnEnd = raw.indexOf("\nfunction ", fnStart + 1);
    const fnBody = raw.slice(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    expect(fnBody).toContain("__dirname");
    expect(fnBody).toContain("services");
    expect(fnBody).toContain("path.resolve");
  });

  it("reads openapi.json from each service's dist/ folder", async () => {
    const raw = await readGateway();
    const fnStart = raw.indexOf("function getMergedOpenApiSpec()");
    const fnEnd = raw.indexOf("\nfunction ", fnStart + 1);
    const fnBody = raw.slice(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    expect(fnBody).toContain("openapi.json");
    expect(fnBody).toContain('"dist"');
  });
});

// ===========================================================================
// PART 6: Schema conflict handling (prefix with service name)
// ===========================================================================

describe("gateway.ts — getMergedOpenApiSpec schema conflict handling", () => {
  it("counts schema name occurrences across services to detect conflicts", async () => {
    const raw = await readGateway();
    const fnStart = raw.indexOf("function getMergedOpenApiSpec()");
    const fnEnd = raw.indexOf("\nfunction ", fnStart + 1);
    const fnBody = raw.slice(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    // The conflict-detection pass increments a counter per schema name
    expect(fnBody).toContain("schemaNameCounts");
  });

  it("prefixes conflicting schema names with the service directory name", async () => {
    const raw = await readGateway();
    const fnStart = raw.indexOf("function getMergedOpenApiSpec()");
    const fnEnd = raw.indexOf("\nfunction ", fnStart + 1);
    const fnBody = raw.slice(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    // Conflict resolution builds a renameMap — check the pattern
    expect(fnBody).toContain("renameMap");
    expect(fnBody).toContain("serviceName");
    // The prefix format is `${serviceName}_${name}`
    expect(fnBody).toContain("`${serviceName}_${name}`");
  });

  it("only prefixes schemas that appear in more than one service (count > 1)", async () => {
    const raw = await readGateway();
    const fnStart = raw.indexOf("function getMergedOpenApiSpec()");
    const fnEnd = raw.indexOf("\nfunction ", fnStart + 1);
    const fnBody = raw.slice(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    // The condition that triggers prefixing
    expect(fnBody).toContain("> 1");
  });
});

// ===========================================================================
// PART 7: $ref rewriting logic
// ===========================================================================

describe("gateway.ts — getMergedOpenApiSpec $ref rewriting", () => {
  it("rewrites $ref pointers in path definitions when schema names change", async () => {
    const raw = await readGateway();
    const fnStart = raw.indexOf("function getMergedOpenApiSpec()");
    const fnEnd = raw.indexOf("\nfunction ", fnStart + 1);
    const fnBody = raw.slice(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    expect(fnBody).toContain("#/components/schemas/");
    expect(fnBody).toContain("replaceAll");
  });

  it("also rewrites $ref pointers within schema definitions themselves", async () => {
    const raw = await readGateway();
    const fnStart = raw.indexOf("function getMergedOpenApiSpec()");
    const fnEnd = raw.indexOf("\nfunction ", fnStart + 1);
    const fnBody = raw.slice(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    // The rewriting is applied twice: once to pathsJson, once to schemasJson
    const refRewriteCount = (
      fnBody.match(/#\/components\/schemas\//g) ?? []
    ).length;
    expect(refRewriteCount).toBeGreaterThanOrEqual(2);
  });

  it("uses JSON.stringify / JSON.parse round-trip for $ref rewriting", async () => {
    const raw = await readGateway();
    const fnStart = raw.indexOf("function getMergedOpenApiSpec()");
    const fnEnd = raw.indexOf("\nfunction ", fnStart + 1);
    const fnBody = raw.slice(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    expect(fnBody).toContain("JSON.stringify");
    expect(fnBody).toContain("JSON.parse");
  });

  it("skips $ref rewriting when no schema names have changed (oldName === newName guard)", async () => {
    const raw = await readGateway();
    const fnStart = raw.indexOf("function getMergedOpenApiSpec()");
    const fnEnd = raw.indexOf("\nfunction ", fnStart + 1);
    const fnBody = raw.slice(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    // The guard that avoids unnecessary replaceAll passes
    expect(fnBody).toContain("oldName !== newName");
  });
});

// ===========================================================================
// PART 8: Graceful error handling during spec merge
// ===========================================================================

describe("gateway.ts — getMergedOpenApiSpec graceful error handling", () => {
  it("wraps root package.json read in try/catch so missing file is non-fatal", async () => {
    const raw = await readGateway();
    const fnStart = raw.indexOf("function getMergedOpenApiSpec()");
    const fnEnd = raw.indexOf("\nfunction ", fnStart + 1);
    const fnBody = raw.slice(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    // There must be a try/catch around the package.json read
    expect(fnBody).toContain("package.json");
    const catchCount = (fnBody.match(/\bcatch\b/g) ?? []).length;
    expect(catchCount).toBeGreaterThanOrEqual(1);
  });

  it("wraps fs.readdirSync in try/catch so missing services/ directory is non-fatal", async () => {
    const raw = await readGateway();
    const fnStart = raw.indexOf("function getMergedOpenApiSpec()");
    const fnEnd = raw.indexOf("\nfunction ", fnStart + 1);
    const fnBody = raw.slice(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    expect(fnBody).toContain("readdirSync");
    // Expect at least two catch blocks: one for package.json, one for readdirSync
    const catchCount = (fnBody.match(/\bcatch\b/g) ?? []).length;
    expect(catchCount).toBeGreaterThanOrEqual(2);
  });

  it("logs a warning with console.warn when a service spec file fails to parse", async () => {
    const raw = await readGateway();
    const fnStart = raw.indexOf("function getMergedOpenApiSpec()");
    const fnEnd = raw.indexOf("\nfunction ", fnStart + 1);
    const fnBody = raw.slice(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    expect(fnBody).toContain("console.warn");
    expect(fnBody).toContain("skipping");
  });

  it("skips individual service spec files that cannot be parsed (continue statement)", async () => {
    const raw = await readGateway();
    const fnStart = raw.indexOf("function getMergedOpenApiSpec()");
    const fnEnd = raw.indexOf("\nfunction ", fnStart + 1);
    const fnBody = raw.slice(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    expect(fnBody).toContain("continue;");
  });

  it("returns a valid-but-empty spec object when services/ directory does not exist", async () => {
    const raw = await readGateway();
    const fnStart = raw.indexOf("function getMergedOpenApiSpec()");
    const fnEnd = raw.indexOf("\nfunction ", fnStart + 1);
    const fnBody = raw.slice(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    // The function always returns an object with openapi/info/paths/components
    // even when serviceEntries is empty (the loop never runs).
    expect(fnBody).toContain("return {");
    expect(fnBody).toContain("openapi:");
    expect(fnBody).toContain("info:");
    expect(fnBody).toContain("paths:");
    expect(fnBody).toContain("components:");
  });
});

// ===========================================================================
// PART 9: OpenApiSpec interface
// ===========================================================================

describe("gateway.ts — OpenApiSpec interface", () => {
  it("declares an OpenApiSpec interface with openapi, info, paths, and components fields", async () => {
    const raw = await readGateway();
    expect(raw).toContain("interface OpenApiSpec");
    expect(raw).toContain("openapi: string");
    expect(raw).toContain("paths: Record<string, unknown>");
    expect(raw).toContain("components?:");
    expect(raw).toContain("schemas?:");
  });

  it("info field in OpenApiSpec includes title and version", async () => {
    const raw = await readGateway();
    const ifaceStart = raw.indexOf("interface OpenApiSpec");
    const ifaceEnd = raw.indexOf("}", ifaceStart);
    const ifaceBody = raw.slice(ifaceStart, ifaceEnd + 1);
    expect(ifaceBody).toContain("title:");
    expect(ifaceBody).toContain("version:");
  });
});

// ===========================================================================
// PART 10: gateway.ts is a static template (no {{variable}} placeholders)
// ===========================================================================

describe("gateway.ts — static template conventions", () => {
  it("does not contain {{variable}} placeholder patterns (it is a static template file)", async () => {
    const raw = await readGateway();
    expect(raw).not.toMatch(/\{\{[a-zA-Z]+\}\}/);
  });
});
