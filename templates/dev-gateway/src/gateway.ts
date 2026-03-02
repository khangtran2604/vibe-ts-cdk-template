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

import * as http from "node:http";
import type { IncomingMessage, ServerResponse, ClientRequest } from "node:http";

// ---------------------------------------------------------------------------
// Route map — longest prefix match determines the upstream target.
// Add new entries here when new services are scaffolded.
// ---------------------------------------------------------------------------

const ROUTES: Record<string, string> = {
  "/health": "http://localhost:3001",
  "/users": "http://localhost:3002",
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
