# Task: Implement filesystem utility functions

## ID
3.1

## Description
Create `src/utils/fs.ts` with core filesystem operations needed by the scaffolder: recursive directory copying, `_` prefix to `.` renaming for dotfiles, `.hbs` suffix stripping, and `{{variable}}` placeholder replacement in file contents. These are the building blocks of the template engine.

## Dependencies
- Task 1.4: types.ts for any shared types

## Inputs
- Template conventions from PLAN.md:
  - `_gitignore` -> `.gitignore` (underscore prefix to dot)
  - `file.hbs` -> `file` (strip .hbs suffix)
  - `{{variable}}` -> actual value (string replacement)
  - `// @feature:X` -> include/remove line based on feature flag

## Outputs / Deliverables
- `src/utils/fs.ts` exporting:
  - `copyDir(src, dest, variables, features)` -- recursive copy with transforms
  - `renameFile(filename)` -- handles `_` prefix and `.hbs` suffix
  - `replaceVariables(content, variables)` -- `{{key}}` replacement
  - `processConditionals(content, features)` -- `// @feature:X` line processing

## Acceptance Criteria
- [ ] `renameFile("_gitignore")` returns `.gitignore`
- [ ] `renameFile("package.json.hbs")` returns `package.json`
- [ ] `renameFile("_eslintrc.json.hbs")` returns `.eslintrc.json`
- [ ] `replaceVariables("Hello {{name}}", { name: "World" })` returns `"Hello World"`
- [ ] `processConditionals` includes lines where the feature is enabled (stripping the `// @feature:X ` prefix)
- [ ] `processConditionals` removes entire lines where the feature is disabled
- [ ] `copyDir` recursively copies all files, applying all transforms
- [ ] `copyDir` creates destination directories as needed
- [ ] Binary files (if any) are copied without text transforms

## Implementation Notes
- Use Node.js `fs/promises` and `path` modules
- For `processConditionals`: regex like `/^\/\/ @feature:(\w+) (.*)$/` to match conditional lines
- `replaceVariables` should use `String.replaceAll("{{key}}", value)` per project conventions -- no template engine
- The `copyDir` function should skip `.DS_Store` and other system files
- Consider making `copyDir` async for better performance with large template directories

## Estimated Complexity
Medium -- Multiple file operations with text transforms and edge cases

## Status
- [x] Complete
