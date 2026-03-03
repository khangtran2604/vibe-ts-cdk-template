import { access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolve the absolute path to the `templates/` directory at the package root.
 *
 * Layout (production):
 *   <root>/dist/index.js   → import.meta.dirname = <root>/dist
 *   <root>/templates/      → join(<root>/dist, "..", "templates")
 */
export function resolveTemplateRoot(): string {
  const dir =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (import.meta as any).dirname ??
    dirname(fileURLToPath(import.meta.url));
  return join(dir, "..", "templates");
}

/**
 * Returns `true` when the given path exists on disk (file or directory).
 * Uses `fs/promises.access` which rejects when the path does not exist.
 */
export async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}
