import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node24",
  banner: {
    js: "#!/usr/bin/env node",
  },
  clean: true,
  dts: false,
  // Do not bundle runtime dependencies — commander and @clack/prompts
  // are listed in package.json "dependencies" and must be resolved at runtime
  // so that pnpm/npm install handles them correctly for consumers of this CLI.
  noExternal: [],
});
