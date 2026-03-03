# Task: Write filesystem utility tests

## ID
7.4

## Description
Create unit tests for the filesystem utility functions: file renaming, variable replacement, conditional processing, and directory copying. These are the foundational operations of the template engine and need thorough coverage.

## Dependencies
- Task 3.1: fs.ts implementation

## Inputs
- `renameFile()`, `replaceVariables()`, `processConditionals()`, `copyDir()` from utils/fs.ts

## Outputs / Deliverables
- `test/fs-utils.test.ts`

## Acceptance Criteria
- [ ] Tests verify `_` prefix to `.` renaming for various filenames
- [ ] Tests verify `.hbs` suffix stripping
- [ ] Tests verify combined `_` prefix and `.hbs` suffix handling
- [ ] Tests verify `{{variable}}` replacement with single and multiple variables
- [ ] Tests verify `// @feature:X` line inclusion when feature enabled
- [ ] Tests verify `// @feature:X` line removal when feature disabled
- [ ] Tests verify `copyDir` creates correct file structure
- [ ] Tests verify `copyDir` applies all transforms during copy
- [ ] Edge cases: files with no transforms, empty files, nested directories

## Implementation Notes
- Use temp directories for `copyDir` tests
- For `processConditionals`, test with multi-line content containing mixed enabled/disabled features
- Test that the `// @feature:X ` prefix is stripped from the line content (not just the feature tag)
- Verify that non-conditional lines pass through unchanged

## Estimated Complexity
Medium -- Many test cases for various edge cases

## Status
- [x] Complete
