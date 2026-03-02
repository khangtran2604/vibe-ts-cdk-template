/**
 * Shared ESLint flat config for the monorepo.
 *
 * Extend it in any workspace package's `eslint.config.js`:
 * ```js
 * import baseConfig from "@<project>/eslint-config";
 * export default [...baseConfig];
 * ```
 *
 * Or add package-specific overrides:
 * ```js
 * import baseConfig from "@<project>/eslint-config";
 * export default [
 *   ...baseConfig,
 *   {
 *     rules: {
 *       "no-console": "off", // Allow console in this package
 *     },
 *   },
 * ];
 * ```
 */

import js from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config[]} */
const baseConfig = [
  // Apply ESLint recommended rules to all JS/TS files.
  js.configs.recommended,

  // Apply typescript-eslint recommended rules.
  ...tseslint.configs.recommended,

  // Global rule overrides for the entire monorepo.
  {
    rules: {
      // Warn on console.log — services should use structured logging.
      "no-console": "warn",

      // Disallow explicit `any` — use `unknown` and narrow properly.
      "@typescript-eslint/no-explicit-any": "warn",

      // Unused variables are almost always bugs.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Prefer `import type` for type-only imports (reduces bundle size
      // and avoids circular dependency issues at runtime).
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },

  // Ignore compiled output and node_modules in every package.
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/*.js.map"],
  },
];

export default baseConfig;
