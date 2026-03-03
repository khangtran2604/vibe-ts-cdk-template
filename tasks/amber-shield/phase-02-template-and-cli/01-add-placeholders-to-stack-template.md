# Task: Add Auth Placeholders to stack.ts.hbs Template

## ID
2.1

## Description
Update the infra stack template `templates/generators/infra-stack/stack.ts.hbs` to include the `{{authorizerSetup}}` placeholder and per-endpoint `{{*AuthOptions}}` placeholders in each `addMethod()` call. When unprotected, all placeholders resolve to empty strings, preserving identical output to the current template.

## Dependencies
- Task 1.3: Auth variables must be defined in the variable map so the placeholders have values to resolve to

## Inputs
- Existing `templates/generators/infra-stack/stack.ts.hbs` template
- Knowledge of the 6 auth variable names from Task 1.3

## Outputs / Deliverables
- Updated `templates/generators/infra-stack/stack.ts.hbs` with auth placeholders

## Acceptance Criteria
- [ ] `{{authorizerSetup}}` is placed after API Gateway creation (after `defaultCorsPreflightOptions` block), before route/method mapping
- [ ] Each `addMethod()` call includes the corresponding `{{*AuthOptions}}` placeholder (e.g., `{{createAuthOptions}}` for POST)
- [ ] When all auth variables are empty strings, the generated output is byte-for-byte identical to current unprotected output (no extra whitespace or blank lines)
- [ ] When auth variables are populated, the generated stack includes valid CDK authorizer code
- [ ] Template remains valid TypeScript after variable substitution in both cases

## Implementation Notes
Pattern for each `addMethod()` call:
```typescript
    {{entityNameLower}}Resource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(create{{EntityName}}Fn, { proxy: true }){{createAuthOptions}}
    );
```

The `{{authorizerSetup}}` block should be on its own line(s) so it cleanly disappears when empty. Consider placing it with a preceding newline that is part of the variable value itself (not the template) to avoid blank lines when unprotected.

## Estimated Complexity
Medium -- Requires careful placement to avoid formatting issues in both protected and unprotected cases.

## Status
- [x] Complete
