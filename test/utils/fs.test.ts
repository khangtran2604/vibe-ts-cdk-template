import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, readFile, writeFile, mkdir, stat, chmod } from "node:fs/promises";
import { join, sep } from "node:path";
import { tmpdir } from "node:os";
import { rmSync } from "node:fs";
import {
  renameFile,
  replaceVariables,
  processConditionals,
  copyDir,
} from "../../src/utils/fs.js";
import type { FeatureFlags } from "../../src/types.js";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

/** All flags off — convenient baseline for conditional tests. */
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

/** All flags on. */
const ALL_ON: FeatureFlags = {
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
// renameFile
// ---------------------------------------------------------------------------

describe("renameFile", () => {
  // Acceptance-criteria cases
  it("converts _gitignore → .gitignore", () => {
    expect(renameFile("_gitignore")).toBe(".gitignore");
  });

  it("strips .hbs suffix from package.json.hbs → package.json", () => {
    expect(renameFile("package.json.hbs")).toBe("package.json");
  });

  it("applies both transforms: _eslintrc.json.hbs → .eslintrc.json", () => {
    expect(renameFile("_eslintrc.json.hbs")).toBe(".eslintrc.json");
  });

  // Additional cases
  it("leaves regular filenames unchanged", () => {
    expect(renameFile("index.ts")).toBe("index.ts");
    expect(renameFile("README.md")).toBe("README.md");
  });

  it("leaves filenames with a dot prefix unchanged (already a dotfile)", () => {
    expect(renameFile(".env")).toBe(".env");
  });

  it("handles _npmrc (no extension) → .npmrc", () => {
    expect(renameFile("_npmrc")).toBe(".npmrc");
  });

  it("handles _.hbs (only underscore + hbs) → . (edge case)", () => {
    // Underscore becomes dot, then .hbs is stripped: _.hbs → .hbs → .
    // Unlikely in practice but the transform must be deterministic.
    expect(renameFile("_.hbs")).toBe(".");
  });

  it("does not strip .hbs from middle of name", () => {
    expect(renameFile("file.hbs.ts")).toBe("file.hbs.ts");
  });

  it("handles nested underscore segments without touching non-leading ones", () => {
    // Only the LEADING underscore is converted.
    expect(renameFile("_some_file.ts")).toBe(".some_file.ts");
  });
});

// ---------------------------------------------------------------------------
// replaceVariables
// ---------------------------------------------------------------------------

describe("replaceVariables", () => {
  it("replaces a single placeholder", () => {
    expect(replaceVariables("Hello {{name}}", { name: "World" })).toBe(
      "Hello World"
    );
  });

  it("replaces multiple different placeholders", () => {
    const result = replaceVariables(
      "Project: {{projectName}}, Region: {{awsRegion}}",
      { projectName: "my-app", awsRegion: "us-east-1" }
    );
    expect(result).toBe("Project: my-app, Region: us-east-1");
  });

  it("replaces every occurrence of the same placeholder", () => {
    const result = replaceVariables("{{x}} and {{x}} and {{x}}", { x: "y" });
    expect(result).toBe("y and y and y");
  });

  it("leaves placeholders that have no matching key unchanged", () => {
    expect(replaceVariables("Hello {{unknown}}", { name: "World" })).toBe(
      "Hello {{unknown}}"
    );
  });

  it("returns the original string when variables map is empty", () => {
    const input = "No placeholders here.";
    expect(replaceVariables(input, {})).toBe(input);
  });

  it("handles an empty string input", () => {
    expect(replaceVariables("", { name: "World" })).toBe("");
  });

  it("handles placeholders adjacent to other text with no spaces", () => {
    expect(replaceVariables("{{a}}{{b}}", { a: "foo", b: "bar" })).toBe(
      "foobar"
    );
  });

  it("does not replace malformed placeholders (single brace)", () => {
    expect(replaceVariables("{name}", { name: "World" })).toBe("{name}");
  });

  it("handles a value that itself contains braces", () => {
    // The replacement value contains braces — should NOT be re-processed.
    const result = replaceVariables("{{key}}", { key: "{{other}}" });
    // replaceVariables iterates keys once, so {{other}} in the output is not
    // replaced unless 'other' is also a key.
    expect(result).toBe("{{other}}");
  });
});

// ---------------------------------------------------------------------------
// processConditionals
// ---------------------------------------------------------------------------

describe("processConditionals", () => {
  describe("enabled features — line is kept without prefix", () => {
    it("keeps a frontend line when frontend is enabled", () => {
      const input = '// @feature:frontend import React from "react"';
      const result = processConditionals(input, { ...ALL_OFF, frontend: true });
      expect(result).toBe('import React from "react"');
    });

    it("keeps an auth line when auth is enabled", () => {
      const input = "// @feature:auth const auth = new Auth();";
      const result = processConditionals(input, { ...ALL_OFF, auth: true });
      expect(result).toBe("const auth = new Auth();");
    });

    it("keeps a database line when database is enabled", () => {
      const input = "// @feature:database const db = new DynamoDB();";
      const result = processConditionals(input, { ...ALL_OFF, database: true });
      expect(result).toBe("const db = new DynamoDB();");
    });
  });

  describe("disabled features — line is removed entirely", () => {
    it("removes a frontend line when frontend is disabled", () => {
      const input = '// @feature:frontend import React from "react"';
      const result = processConditionals(input, ALL_OFF);
      expect(result).toBe("");
    });

    it("removes an auth line when auth is disabled", () => {
      const input = "// @feature:auth const auth = new Auth();";
      const result = processConditionals(input, ALL_OFF);
      expect(result).toBe("");
    });
  });

  describe("unknown feature name — treated as disabled", () => {
    it("removes lines with unknown feature names", () => {
      const input = "// @feature:nonexistent some code";
      const result = processConditionals(input, ALL_OFF);
      expect(result).toBe("");
    });
  });

  describe("non-conditional lines — passed through unchanged", () => {
    it("keeps ordinary code lines", () => {
      const input = 'const x = "hello";';
      expect(processConditionals(input, ALL_OFF)).toBe(input);
    });

    it("keeps regular comments", () => {
      const input = "// This is a normal comment";
      expect(processConditionals(input, ALL_OFF)).toBe(input);
    });

    it("keeps blank lines", () => {
      expect(processConditionals("", ALL_OFF)).toBe("");
    });
  });

  describe("multi-line content", () => {
    it("selectively keeps/removes lines based on individual feature flags", () => {
      const input = [
        "import { something } from 'somewhere';",
        '// @feature:frontend import React from "react"',
        "// @feature:auth import { Cognito } from './cognito'",
        "export const handler = async () => {};",
      ].join("\n");

      // frontend on, auth off
      const result = processConditionals(input, {
        ...ALL_OFF,
        frontend: true,
      });

      const lines = result.split("\n");
      expect(lines).toHaveLength(3); // auth line removed
      expect(lines[0]).toBe("import { something } from 'somewhere';");
      expect(lines[1]).toBe('import React from "react"');
      expect(lines[2]).toBe("export const handler = async () => {};");
    });

    it("preserves all non-conditional lines when all features are off", () => {
      const input = [
        "line one",
        "// @feature:frontend removed",
        "line three",
      ].join("\n");
      const result = processConditionals(input, ALL_OFF);
      expect(result).toBe("line one\nline three");
    });

    it("keeps all conditional lines when all features are on", () => {
      const input = [
        "// @feature:frontend kept A",
        "// @feature:auth kept B",
        "// @feature:database kept C",
      ].join("\n");
      const result = processConditionals(input, ALL_ON);
      expect(result).toBe("kept A\nkept B\nkept C");
    });
  });

  describe("indented annotations", () => {
    it("removes an indented feature line when the feature is disabled", () => {
      const input = "  // @feature:database const user = await repo.find(id);";
      const result = processConditionals(input, ALL_OFF);
      expect(result).toBe("");
    });

    it("keeps an indented feature line with original indentation when enabled", () => {
      const input = "  // @feature:database const user = await repo.find(id);";
      const result = processConditionals(input, { ...ALL_OFF, database: true });
      expect(result).toBe("  const user = await repo.find(id);");
    });

    it("handles tab-indented annotations", () => {
      const input = "\t// @feature:database const user = await repo.find(id);";
      const result = processConditionals(input, { ...ALL_OFF, database: true });
      expect(result).toBe("\tconst user = await repo.find(id);");
    });

    it("mixes indented and top-level annotations correctly", () => {
      const input = [
        "// @feature:database import { repo } from './repo.js';",
        "export async function handler() {",
        "  // @feature:database const user = await repo.find('1');",
        "  const user = store.get('1');",
        "}",
      ].join("\n");

      // database off: both @feature:database lines removed
      const resultOff = processConditionals(input, ALL_OFF);
      expect(resultOff).toBe(
        "export async function handler() {\n  const user = store.get('1');\n}"
      );

      // database on: annotations stripped, code + indentation kept
      const resultOn = processConditionals(input, { ...ALL_OFF, database: true });
      expect(resultOn).toBe(
        "import { repo } from './repo.js';\nexport async function handler() {\n  const user = await repo.find('1');\n  const user = store.get('1');\n}"
      );
    });
  });

  describe("edge cases", () => {
    it("handles an empty string", () => {
      expect(processConditionals("", ALL_ON)).toBe("");
    });

    it("does not match // @feature: with no feature name", () => {
      // The regex requires at least one word character after the colon.
      const input = "// @feature: some code";
      expect(processConditionals(input, ALL_ON)).toBe(input);
    });
  });
});

// ---------------------------------------------------------------------------
// copyDir — integration tests using a real temp directory
// ---------------------------------------------------------------------------

describe("copyDir", () => {
  let tmpDir: string;
  let srcDir: string;
  let destDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "fs-test-"));
    srcDir = join(tmpDir, "src");
    destDir = join(tmpDir, "dest");
    await mkdir(srcDir, { recursive: true });
  });

  afterEach(() => {
    // Synchronous removal avoids lingering async handles in test runner.
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // Helper: read a file from the dest directory.
  async function readDest(relPath: string): Promise<string> {
    return readFile(join(destDir, relPath), "utf8");
  }

  it("creates the destination directory when it does not exist", async () => {
    await writeFile(join(srcDir, "file.txt"), "hello");
    await copyDir(srcDir, destDir, {}, ALL_OFF);
    const content = await readDest("file.txt");
    expect(content).toBe("hello");
  });

  it("copies a plain text file without modification", async () => {
    await writeFile(join(srcDir, "readme.txt"), "No placeholders here.");
    await copyDir(srcDir, destDir, {}, ALL_OFF);
    expect(await readDest("readme.txt")).toBe("No placeholders here.");
  });

  it("applies variable substitution to text files", async () => {
    await writeFile(join(srcDir, "config.txt"), "region={{awsRegion}}");
    await copyDir(srcDir, destDir, { awsRegion: "eu-west-1" }, ALL_OFF);
    expect(await readDest("config.txt")).toBe("region=eu-west-1");
  });

  it("applies conditional processing to text files", async () => {
    const src = [
      "base line",
      "// @feature:frontend REACT_CODE",
    ].join("\n");
    await writeFile(join(srcDir, "app.ts"), src);

    await copyDir(srcDir, destDir, {}, { ...ALL_OFF, frontend: true });
    expect(await readDest("app.ts")).toBe("base line\nREACT_CODE");
  });

  it("renames _gitignore → .gitignore", async () => {
    await writeFile(join(srcDir, "_gitignore"), "node_modules");
    await copyDir(srcDir, destDir, {}, ALL_OFF);
    expect(await readDest(".gitignore")).toBe("node_modules");
  });

  it("renames package.json.hbs → package.json and substitutes variables", async () => {
    await writeFile(
      join(srcDir, "package.json.hbs"),
      '{"name":"{{projectName}}"}'
    );
    await copyDir(srcDir, destDir, { projectName: "my-app" }, ALL_OFF);
    expect(await readDest("package.json")).toBe('{"name":"my-app"}');
  });

  it("renames _eslintrc.json.hbs → .eslintrc.json", async () => {
    await writeFile(join(srcDir, "_eslintrc.json.hbs"), "{}");
    await copyDir(srcDir, destDir, {}, ALL_OFF);
    expect(await readDest(".eslintrc.json")).toBe("{}");
  });

  it("recursively copies files in nested sub-directories", async () => {
    const subDir = join(srcDir, "nested", "deep");
    await mkdir(subDir, { recursive: true });
    await writeFile(join(subDir, "file.txt"), "deep content");
    await copyDir(srcDir, destDir, {}, ALL_OFF);
    expect(await readDest(join("nested", "deep", "file.txt"))).toBe(
      "deep content"
    );
  });

  it("renames _github/ directory → .github/ (directory dotfile rename)", async () => {
    const ghDir = join(srcDir, "_github", "workflows");
    await mkdir(ghDir, { recursive: true });
    await writeFile(join(ghDir, "ci.yml"), "name: CI");
    await copyDir(srcDir, destDir, {}, ALL_OFF);
    expect(await readDest(join(".github", "workflows", "ci.yml"))).toBe(
      "name: CI"
    );
  });

  it("creates nested destination directories as needed", async () => {
    await mkdir(join(srcDir, "a", "b"), { recursive: true });
    await writeFile(join(srcDir, "a", "b", "c.txt"), "abc");
    // destDir does not exist yet; copyDir must create the full tree.
    await copyDir(srcDir, destDir, {}, ALL_OFF);
    expect(await readDest(join("a", "b", "c.txt"))).toBe("abc");
  });

  it("skips .DS_Store files", async () => {
    await writeFile(join(srcDir, ".DS_Store"), "");
    await writeFile(join(srcDir, "keep.txt"), "keep");
    await copyDir(srcDir, destDir, {}, ALL_OFF);

    const { access } = await import("node:fs/promises");
    // .DS_Store should NOT exist in dest
    await expect(
      access(join(destDir, ".DS_Store"))
    ).rejects.toThrow();
    // Regular file should exist
    expect(await readDest("keep.txt")).toBe("keep");
  });

  it("applies both variable substitution and conditionals in one pass", async () => {
    const src = [
      "const region = '{{awsRegion}}';",
      "// @feature:frontend const x = 1;",
      "// @feature:auth const y = 2;",
    ].join("\n");
    await writeFile(join(srcDir, "combined.ts"), src);

    await copyDir(
      srcDir,
      destDir,
      { awsRegion: "ap-southeast-1" },
      { ...ALL_OFF, frontend: true }
    );

    const result = await readDest("combined.ts");
    expect(result).toBe(
      "const region = 'ap-southeast-1';\nconst x = 1;"
    );
  });

  it("handles an empty source directory", async () => {
    // Should resolve without error and create the (empty) dest directory.
    await expect(copyDir(srcDir, destDir, {}, ALL_OFF)).resolves.toBeUndefined();
  });

  it("renames _husky/ directory → .husky/ (models extras template layout)", async () => {
    const huskyDir = join(srcDir, "_husky");
    await mkdir(huskyDir, { recursive: true });
    const hookFile = join(huskyDir, "pre-commit");
    await writeFile(hookFile, "npx lint-staged\n");
    await chmod(hookFile, 0o755);
    await copyDir(srcDir, destDir, {}, ALL_OFF);
    const content = await readDest(join(".husky", "pre-commit"));
    expect(content).toBe("npx lint-staged\n");
  });

  it("mirrors executable bit: source file with chmod 755 → dest file is executable", async () => {
    const hookFile = join(srcDir, "pre-commit");
    await writeFile(hookFile, "npx lint-staged\n");
    await chmod(hookFile, 0o755);
    await copyDir(srcDir, destDir, {}, ALL_OFF);
    const destStat = await stat(join(destDir, "pre-commit"));
    // 0o111 = owner + group + other execute bits
    expect(destStat.mode & 0o111).not.toBe(0);
  });

  it("does not make non-executable source files executable in dest", async () => {
    const normalFile = join(srcDir, "config.json");
    await writeFile(normalFile, "{}");
    await chmod(normalFile, 0o644);
    await copyDir(srcDir, destDir, {}, ALL_OFF);
    const destStat = await stat(join(destDir, "config.json"));
    // Should NOT have execute bits set
    expect(destStat.mode & 0o111).toBe(0);
  });
});
