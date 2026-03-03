/**
 * Local development reverse proxy gateway.
 *
 * Listens on port 3000 and forwards requests to the individual service dev
 * servers based on path prefix, mirroring API Gateway routing in production.
 *
 * Route map:
 *   /health/* → http://localhost:3001
 *   /users/*  → http://localhost:3002
 *
 * This file is NOT deployed to AWS — it exists solely for local development.
 *
 * Run with:  pnpm dev   (uses tsx watch for hot reload)
 */

import * as fs from "node:fs";
import * as http from "node:http";
import type { IncomingMessage, ServerResponse, ClientRequest } from "node:http";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Route map — longest prefix match determines the upstream target.
// Add new entries here when new services are scaffolded.
// ---------------------------------------------------------------------------

const ROUTES: Record<string, string> = {
  "/health": "http://localhost:3001",
  "/users": "http://localhost:3002",
  // @module-inject:route
};

const GATEWAY_PORT = 3000;

// ---------------------------------------------------------------------------
// CORS headers added to every response (including proxied ones).
// ---------------------------------------------------------------------------

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Id",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find the upstream base URL for the given request path using longest-prefix
 * matching against ROUTES.
 *
 * Returns `null` when no route matches.
 */
function resolveUpstream(path: string): string | null {
  let matched: string | null = null;
  let longestMatch = 0;

  for (const prefix of Object.keys(ROUTES)) {
    if (path === prefix || path.startsWith(prefix + "/")) {
      if (prefix.length > longestMatch) {
        longestMatch = prefix.length;
        matched = ROUTES[prefix]!;
      }
    }
  }

  return matched;
}

/**
 * Write CORS headers onto an outgoing response.
 */
function applyCorsHeaders(res: ServerResponse): void {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value);
  }
}

// ---------------------------------------------------------------------------
// OpenAPI spec merger
// ---------------------------------------------------------------------------

interface OpenApiSpec {
  openapi: string;
  info: { title: string; version: string; [key: string]: unknown };
  paths: Record<string, unknown>;
  components?: { schemas?: Record<string, unknown>; [key: string]: unknown };
  [key: string]: unknown;
}

/**
 * Scans all compiled service distributions for openapi.json files, then
 * merges every `paths` map and every `components.schemas` map into a single
 * unified spec.
 *
 * Schema name conflicts are resolved by prefixing the schema name with the
 * service directory name (e.g. `users_User`, `orders_Order`).
 *
 * Missing spec files are silently skipped so the gateway keeps working during
 * incremental development.
 */
function getMergedOpenApiSpec(): OpenApiSpec {
  const servicesDir = path.resolve(__dirname, "../../services");

  // Read root package.json for the version field.
  let projectName = "API";
  let projectVersion = "0.0.0";
  try {
    const rootPkg = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../../../package.json"), "utf8")
    ) as { name?: string; version?: string };
    if (rootPkg.name) projectName = rootPkg.name;
    if (rootPkg.version) projectVersion = rootPkg.version;
  } catch {
    // Non-fatal — fall back to defaults.
  }

  const mergedPaths: Record<string, unknown> = {};
  const mergedSchemas: Record<string, unknown> = {};

  // Enumerate service directories. If the services directory does not exist
  // yet (e.g. during a fresh scaffold), return an empty-but-valid spec.
  let serviceEntries: fs.Dirent[] = [];
  try {
    serviceEntries = fs.readdirSync(servicesDir, { withFileTypes: true });
  } catch {
    // services/ directory not present — return minimal spec.
  }

  // First pass: collect all schema names per service to detect conflicts.
  const schemasByService: Array<{
    serviceName: string;
    spec: OpenApiSpec;
    schemaNames: string[];
  }> = [];
  const schemaNameCounts: Record<string, number> = {};

  for (const entry of serviceEntries) {
    if (!entry.isDirectory()) continue;

    const specPath = path.join(servicesDir, entry.name, "dist", "openapi.json");
    if (!fs.existsSync(specPath)) continue;

    let spec: OpenApiSpec;
    try {
      spec = JSON.parse(fs.readFileSync(specPath, "utf8")) as OpenApiSpec;
    } catch {
      console.warn(`[gateway] failed to parse ${specPath} — skipping`);
      continue;
    }

    const schemaNames = Object.keys(spec.components?.schemas ?? {});
    schemasByService.push({ serviceName: entry.name, spec, schemaNames });
    for (const name of schemaNames) {
      schemaNameCounts[name] = (schemaNameCounts[name] ?? 0) + 1;
    }
  }

  // Second pass: merge paths and schemas, prefixing only conflicting names.
  for (const { serviceName, spec, schemaNames } of schemasByService) {
    // Build rename map for this service's schemas.
    const renameMap: Record<string, string> = {};
    for (const name of schemaNames) {
      renameMap[name] =
        schemaNameCounts[name]! > 1 ? `${serviceName}_${name}` : name;
    }

    const hasRenames = Object.keys(renameMap).some((k) => renameMap[k] !== k);

    // Merge schemas (renamed where needed). Rewrite $ref pointers within
    // this service's schemas BEFORE merging so we never accidentally touch
    // schemas from other services.
    const schemas = spec.components?.schemas;
    if (schemas && typeof schemas === "object") {
      let serviceSchemas = schemas;
      if (hasRenames) {
        let schemasJson = JSON.stringify(schemas);
        for (const [oldName, newName] of Object.entries(renameMap)) {
          if (oldName !== newName) {
            schemasJson = schemasJson.replaceAll(
              `#/components/schemas/${oldName}`,
              `#/components/schemas/${newName}`
            );
          }
        }
        serviceSchemas = JSON.parse(schemasJson) as Record<string, unknown>;
      }
      for (const [schemaName, schemaDef] of Object.entries(serviceSchemas)) {
        mergedSchemas[renameMap[schemaName] ?? schemaName] = schemaDef;
      }
    }

    // Merge paths, rewriting $ref pointers to match renamed schemas.
    if (spec.paths && typeof spec.paths === "object") {
      let pathsJson = JSON.stringify(spec.paths);
      if (hasRenames) {
        for (const [oldName, newName] of Object.entries(renameMap)) {
          if (oldName !== newName) {
            pathsJson = pathsJson.replaceAll(
              `#/components/schemas/${oldName}`,
              `#/components/schemas/${newName}`
            );
          }
        }
      }
      Object.assign(mergedPaths, JSON.parse(pathsJson));
    }
  }

  return {
    openapi: "3.1.0",
    info: {
      title: `${projectName} — Local Dev`,
      version: projectVersion,
    },
    paths: mergedPaths,
    components: {
      schemas: mergedSchemas,
    },
  };
}

// ---------------------------------------------------------------------------
// Swagger UI HTML
// ---------------------------------------------------------------------------

const SWAGGER_UI_HTML = /* html */ `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function () {
        SwaggerUIBundle({
          url: "/docs/openapi.json",
          dom_id: "#swagger-ui",
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: "StandaloneLayout",
          deepLinking: true,
        });
      };
    </script>
  </body>
</html>
`;

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------

function handleRequest(req: IncomingMessage, res: ServerResponse): void {
  const method = req.method ?? "GET";
  const url = req.url ?? "/";

  // Respond to CORS preflight immediately — no need to proxy OPTIONS.
  if (method === "OPTIONS") {
    applyCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // -------------------------------------------------------------------------
  // Built-in documentation endpoints — handled before the proxy logic so they
  // never fall through to resolveUpstream and do not require a running service.
  // -------------------------------------------------------------------------

  if (url === "/docs/openapi.json") {
    try {
      const spec = getMergedOpenApiSpec();
      const body = JSON.stringify(spec, null, 2);
      applyCorsHeaders(res);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(body);
    } catch (err) {
      applyCorsHeaders(res);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "INTERNAL_ERROR",
          message: "Failed to generate OpenAPI spec.",
        })
      );
      console.error("[gateway] /docs/openapi.json error:", err);
    }
    return;
  }

  if (url === "/docs") {
    applyCorsHeaders(res);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(SWAGGER_UI_HTML);
    return;
  }

  const upstream = resolveUpstream(url);

  if (upstream === null) {
    applyCorsHeaders(res);
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "NOT_FOUND",
        message: `No route configured for path: ${url}`,
      })
    );
    return;
  }

  const target = new URL(url, upstream);
  const upstreamHostname = target.hostname;
  const upstreamPort = target.port ? Number(target.port) : 80;
  const upstreamPath = target.pathname + (target.search ?? "");

  console.log(`→ ${method} ${url} → ${upstream}`);

  const proxyReq: ClientRequest = http.request(
    {
      hostname: upstreamHostname,
      port: upstreamPort,
      path: upstreamPath,
      method,
      headers: {
        ...req.headers,
        // Rewrite the Host header to the upstream address so services
        // do not reject requests destined for a different hostname.
        host: upstreamPort === 80
          ? upstreamHostname
          : `${upstreamHostname}:${upstreamPort}`,
      },
    },
    (upstreamRes) => {
      // Copy status and upstream headers, then layer our CORS headers on top.
      const statusCode = upstreamRes.statusCode ?? 502;
      const headers: Record<string, string | string[]> = {};

      for (const [key, value] of Object.entries(upstreamRes.headers)) {
        if (value !== undefined) {
          headers[key] = value as string | string[];
        }
      }

      // CORS headers override anything the upstream service may have set.
      Object.assign(headers, CORS_HEADERS);

      res.writeHead(statusCode, headers);
      upstreamRes.pipe(res, { end: true });
    }
  );

  proxyReq.on("error", (err) => {
    const message =
      (err as NodeJS.ErrnoException).code === "ECONNREFUSED"
        ? `Upstream service is not running at ${upstream}. Start it with 'pnpm dev' in the service directory.`
        : err.message;

    console.error(`[gateway] upstream error: ${message}`);

    if (!res.headersSent) {
      applyCorsHeaders(res);
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "BAD_GATEWAY",
          message,
        })
      );
    }
  });

  // Forward the request body (if any) to the upstream service.
  req.pipe(proxyReq, { end: true });
}

// ---------------------------------------------------------------------------
// Server startup
// ---------------------------------------------------------------------------

const server = http.createServer(handleRequest);

server.listen(GATEWAY_PORT, () => {
  console.log(`[gateway] listening on http://localhost:${GATEWAY_PORT}`);
  console.log("[gateway] routes:");
  for (const [prefix, target] of Object.entries(ROUTES)) {
    console.log(`  ${prefix}/* → ${target}`);
  }
});

server.on("error", (err) => {
  console.error("[gateway] server error:", err.message);
  process.exit(1);
});
