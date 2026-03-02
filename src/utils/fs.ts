import {
  readdir,
  readFile,
  writeFile,
  mkdir,
  copyFile,
} from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import type { FeatureFlags } from "../types.js";

/**
 * Files and directories to skip during template copying.
 * These are OS/editor artefacts that should never end up in the output.
 */
const SKIP_NAMES = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);

/**
 * Extensions that indicate binary content.
 * These files are copied byte-for-byte — no text transforms are applied.
 */
const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".svg", // SVG can contain {{…}} in theory, but treat as binary for safety
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".otf",
  ".pdf",
  ".zip",
  ".tar",
  ".gz",
  ".br",
]);

/**
 * Matches `// @feature:<name> <rest of line>` conditional annotations.
 *
 * Group 1: feature name  (word characters only — matches FeatureFlags keys)
 * Group 2: the actual code / text to keep when the feature is enabled
 *
 * Hoisted to module scope so it is compiled once rather than on every call
 * to {@link processConditionals}.
 */
const CONDITIONAL_RE = /^\/\/ @feature:(\w+) (.*)$/;

// ---------------------------------------------------------------------------
// Public helpers — pure functions (no I/O), easy to unit-test
// ---------------------------------------------------------------------------

/**
 * Converts a raw template filename into the filename that should appear on
 * disk in the generated project.
 *
 * Two transforms are applied in order:
 *  1. A leading `_` is replaced with `.`  — e.g. `_gitignore` → `.gitignore`
 *  2. A trailing `.hbs` suffix is stripped — e.g. `package.json.hbs` → `package.json`
 *
 * Both transforms can apply to the same name:
 *  `_eslintrc.json.hbs` → `.eslintrc.json`
 *
 * @param filename - The raw basename from the template directory.
 * @returns The destination filename.
 */
export function renameFile(filename: string): string {
  // Step 1: leading underscore → dot (dotfile restoration)
  let name = filename.startsWith("_") ? `.${filename.slice(1)}` : filename;

  // Step 2: strip .hbs suffix (marks files that contain {{…}} placeholders)
  if (name.endsWith(".hbs")) {
    name = name.slice(0, -4);
  }

  return name;
}

/**
 * Replaces all `{{key}}` placeholders in `content` with the corresponding
 * value from `variables`.
 *
 * - Placeholders with no matching key are left unchanged.
 * - Uses `String.prototype.replaceAll` — no template engine dependency.
 *
 * @param content   - Raw template string, possibly containing `{{key}}` tokens.
 * @param variables - Map of placeholder keys to their substitution values.
 * @returns The content string with all known placeholders replaced.
 *
 * @example
 * replaceVariables("Hello {{name}}!", { name: "World" }) // "Hello World!"
 */
export function replaceVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

/**
 * Processes `// @feature:X <rest>` conditional lines in template content.
 *
 * - If feature `X` is **enabled** in `features`: the annotation prefix
 *   (`// @feature:X `) is stripped and the rest of the line is kept.
 * - If feature `X` is **disabled**: the entire line is removed.
 * - Lines that do not match the pattern are passed through unchanged.
 *
 * The feature name must be a key of {@link FeatureFlags}.  Unknown feature
 * names are treated as disabled (line is removed), preventing accidental
 * inclusion of content for typo'd flags.
 *
 * @param content  - Template file content as a string.
 * @param features - The resolved feature flags for the current project.
 * @returns The processed content string.
 *
 * @example
 * // features = { frontend: true, auth: false, ... }
 * processConditionals('// @feature:frontend import React from "react"', features)
 * // → 'import React from "react"'
 *
 * processConditionals('// @feature:auth import { Auth } from "./auth"', features)
 * // → ''  (line removed entirely)
 */
export function processConditionals(
  content: string,
  features: FeatureFlags
): string {
  const lines = content.split("\n");
  const output: string[] = [];

  for (const line of lines) {
    const match = CONDITIONAL_RE.exec(line);
    if (match === null) {
      // Not a conditional line — keep as-is.
      output.push(line);
      continue;
    }

    const featureName = match[1] as keyof FeatureFlags;
    const isEnabled = features[featureName] === true;

    if (isEnabled) {
      // Feature is on: strip the annotation prefix, keep the rest.
      output.push(match[2]);
    }
    // Feature is off: discard the entire line (don't push anything).
  }

  return output.join("\n");
}

// ---------------------------------------------------------------------------
// File extension helper
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the file should be copied without text transforms
 * (i.e. it is a binary asset).
 */
function isBinaryFile(filename: string): boolean {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return false;
  return BINARY_EXTENSIONS.has(filename.slice(dotIndex).toLowerCase());
}

// ---------------------------------------------------------------------------
// Recursive directory copy
// ---------------------------------------------------------------------------

/**
 * Recursively copies all files from `src` into `dest`, applying template
 * transforms to text files along the way.
 *
 * For each file the following pipeline runs (in order):
 *  1. Skip OS artefacts (`.DS_Store`, etc.).
 *  2. Rename: `_` prefix → `.`, `.hbs` suffix stripped ({@link renameFile}).
 *  3. Path containment check: rejects any entry whose resolved destination
 *     falls outside the `dest` root (guards against path-traversal in
 *     template filenames).
 *  4. Binary detection: binary files are copied without further transforms.
 *  5. {@link replaceVariables}: `{{key}}` substitution.
 *  6. {@link processConditionals}: `// @feature:X` line inclusion/removal.
 *
 * Destination sub-directories are created with `mkdir({ recursive: true })`
 * so there is no need for the caller to pre-create the tree.
 *
 * @param src       - Absolute path to the source template directory.
 * @param dest      - Absolute path to the output directory.
 * @param variables - Placeholder substitution map (see {@link replaceVariables}).
 * @param features  - Feature flags controlling conditional lines
 *                    (see {@link processConditionals}).
 *
 * @example
 * await copyDir(
 *   "/path/to/templates/base",
 *   "/path/to/output/my-app",
 *   { projectName: "my-app", awsRegion: "us-east-1" },
 *   getFeatureFlags("minimal"),
 * );
 */
export async function copyDir(
  src: string,
  dest: string,
  variables: Record<string, string>,
  features: FeatureFlags
): Promise<void> {
  // Ensure the destination directory exists before writing any files into it.
  await mkdir(dest, { recursive: true });

  const entries = await readdir(src, { withFileTypes: true });

  // Process all entries concurrently for better throughput on large template
  // trees. mkdir is idempotent so concurrent sub-directory creation is safe.
  await Promise.all(
    entries.map(async (entry) => {
      const srcPath = join(src, entry.name);

      if (entry.isDirectory()) {
        // Recurse — directory names are not transformed.
        const destSubdir = join(dest, entry.name);
        await copyDir(srcPath, destSubdir, variables, features);
        return;
      }

      if (!entry.isFile()) {
        // Skip symlinks and other special entries.
        return;
      }

      if (SKIP_NAMES.has(entry.name)) {
        return;
      }

      const destName = renameFile(entry.name);
      const destPath = join(dest, destName);

      // Guard against path traversal: the resolved destination must remain
      // inside the dest root.  A crafted template filename containing ".."
      // segments could otherwise escape the project directory.
      const resolvedDest = resolve(destPath);
      const resolvedRoot = resolve(dest);
      if (
        !resolvedDest.startsWith(resolvedRoot + sep) &&
        resolvedDest !== resolvedRoot
      ) {
        throw new Error(
          `Path traversal detected: "${entry.name}" resolves outside the project directory.`
        );
      }

      if (isBinaryFile(entry.name)) {
        // Binary: byte-for-byte copy, no text transforms.
        await copyFile(srcPath, destPath);
        return;
      }

      // Text file: read → transform → write.
      let content = await readFile(srcPath, "utf8");
      content = replaceVariables(content, variables);
      content = processConditionals(content, features);
      await writeFile(destPath, content, "utf8");
    })
  );
}
