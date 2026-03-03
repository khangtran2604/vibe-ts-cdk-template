/**
 * Module context detection for vibe-ts-cdk-template.
 *
 * Exports functions that inspect an existing scaffolded project directory to
 * extract the context needed by the module generator:
 *
 *  - {@link detectProjectContext}  — validates the directory is a scaffolded project
 *  - {@link readProjectName}       — reads the project name from root package.json
 *  - {@link scanNextPort}          — finds the highest dev-server port in use and
 *                                    returns the next available one
 *
 * All functions are async and use only `node:fs/promises` — no sync I/O.
 */

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathExists } from "./utils/paths.js";

/**
 * Regex that matches a port literal assigned to a `PORT` constant in a
 * dev-server source file.
 *
 * Matches both styles used in the templates:
 *   `const PORT = 3001;`
 *   `const PORT = 3002`
 *
 * Capture group 1: the port number as a string.
 *
 * Hoisted to module scope so it is compiled once rather than on every call
 * to {@link scanNextPort}.
 */
const PORT_RE = /\bconst\s+PORT\s*=\s*(\d+)/;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Verifies that `projectDir` is a valid scaffolded project by checking for
 * the presence of the four structural markers that every preset produces:
 *
 *  - `infra/`              CDK application
 *  - `services/`           Lambda microservices
 *  - `dev-gateway/`        Local proxy
 *  - `pnpm-workspace.yaml` Monorepo manifest
 *
 * @param projectDir - Absolute path to the candidate project root.
 * @throws {Error} When any of the required paths are missing, listing them all.
 *
 * @example
 * await detectProjectContext("/home/user/my-app");
 * // Throws: 'Not a valid scaffolded project in "/home/user/my-app".\n
 * //          Missing: dev-gateway/, pnpm-workspace.yaml'
 */
export async function detectProjectContext(projectDir: string): Promise<void> {
  const checks: Array<{ label: string; path: string }> = [
    { label: "infra/", path: join(projectDir, "infra") },
    { label: "services/", path: join(projectDir, "services") },
    { label: "dev-gateway/", path: join(projectDir, "dev-gateway") },
    {
      label: "pnpm-workspace.yaml",
      path: join(projectDir, "pnpm-workspace.yaml"),
    },
  ];

  // Run all existence checks concurrently — independent I/O operations.
  const results = await Promise.all(
    checks.map(async ({ label, path }) => ({
      label,
      exists: await pathExists(path),
    }))
  );

  const missing = results
    .filter(({ exists }) => !exists)
    .map(({ label }) => label);

  if (missing.length > 0) {
    throw new Error(
      `Not a valid scaffolded project in "${projectDir}".\n` +
        `Missing: ${missing.join(", ")}`
    );
  }
}

/**
 * Reads the `name` field from the root `package.json` of a scaffolded project.
 *
 * @param projectDir - Absolute path to the project root.
 * @returns The `name` string from package.json.
 * @throws {Error} When `package.json` does not exist or cannot be read.
 * @throws {Error} When `package.json` does not contain a `name` field.
 *
 * @example
 * const name = await readProjectName("/home/user/my-app");
 * // → "my-app"
 */
export async function readProjectName(projectDir: string): Promise<string> {
  const pkgPath = join(projectDir, "package.json");

  let raw: string;
  try {
    raw = await readFile(pkgPath, "utf8");
  } catch {
    throw new Error(
      `Cannot read package.json at "${pkgPath}". ` +
        `Make sure "${projectDir}" is a valid scaffolded project.`
    );
  }

  let pkg: unknown;
  try {
    pkg = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse package.json at "${pkgPath}".`);
  }

  if (
    typeof pkg !== "object" ||
    pkg === null ||
    !("name" in pkg) ||
    typeof (pkg as Record<string, unknown>)["name"] !== "string" ||
    (pkg as Record<string, unknown>)["name"] === ""
  ) {
    throw new Error(
      `package.json at "${pkgPath}" does not contain a valid "name" field.`
    );
  }

  return (pkg as Record<string, string>)["name"];
}

/**
 * Scans every `services/<service>/src/dev-server.ts` file for port
 * assignments of the form `const PORT = <number>` and returns the highest
 * port found plus one.
 *
 * This gives the module generator a safe, collision-free port for the new
 * service's local dev server without requiring the user to pick one manually.
 *
 * If the `services/` directory does not exist, is empty, or none of the
 * dev-server files contain a recognisable port declaration, the function
 * returns the base port **3001** (the first port used by the health service).
 *
 * @param projectDir - Absolute path to the project root.
 * @returns The next available port number (max existing port + 1, or 3001).
 *
 * @example
 * // services/health uses 3001, services/users uses 3002
 * const port = await scanNextPort("/home/user/my-app");
 * // → 3003
 */
export async function scanNextPort(projectDir: string): Promise<number> {
  const DEFAULT_PORT = 3001;
  const servicesDir = join(projectDir, "services");

  // If the services directory doesn't exist, return the default.
  if (!(await pathExists(servicesDir))) {
    return DEFAULT_PORT;
  }

  let entries: Awaited<ReturnType<typeof readdir>>;
  try {
    entries = await readdir(servicesDir, { withFileTypes: true });
  } catch {
    return DEFAULT_PORT;
  }

  // Collect only subdirectory entries — each represents one microservice.
  const serviceDirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  if (serviceDirs.length === 0) {
    return DEFAULT_PORT;
  }

  // Read all dev-server files concurrently and extract port numbers.
  const portResults = await Promise.all(
    serviceDirs.map(async (service) => {
      const devServerPath = join(
        servicesDir,
        service,
        "src",
        "dev-server.ts"
      );

      let content: string;
      try {
        content = await readFile(devServerPath, "utf8");
      } catch {
        // No dev-server.ts for this service — skip it.
        return null;
      }

      const match = PORT_RE.exec(content);
      if (match === null) {
        return null;
      }

      const port = parseInt(match[1], 10);
      return Number.isFinite(port) ? port : null;
    })
  );

  // Filter out nulls and find the maximum port across all services.
  const ports = portResults.filter((p): p is number => p !== null);

  if (ports.length === 0) {
    return DEFAULT_PORT;
  }

  return Math.max(...ports) + 1;
}
