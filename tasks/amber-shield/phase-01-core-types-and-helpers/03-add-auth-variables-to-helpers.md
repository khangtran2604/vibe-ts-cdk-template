# Task: Add Auth Variables to getModuleVariableMap() in module-helpers.ts

## ID
1.3

## Description
Extend `getModuleVariableMap()` in `src/module-helpers.ts` to produce auth-related template variables when `protectedEndpoints` is present in the module config. This includes the `authorizerSetup` block (CDK code that imports the existing Cognito authorizer) and per-endpoint `*AuthOptions` variables that inject authorizer method options into `addMethod()` calls.

## Dependencies
- Task 1.1: Needs `ProtectedEndpoints` type from `src/types.ts`

## Inputs
- `ProtectedEndpoints` interface from `src/types.ts`
- Existing `getModuleVariableMap()` function signature and return shape
- Knowledge of how AuthStack exports `AuthorizerFunctionArn` via `CfnOutput`

## Outputs / Deliverables
- Updated `src/module-helpers.ts` with auth variable generation logic
- New variables in the map: `authorizerSetup`, `listAuthOptions`, `getAuthOptions`, `createAuthOptions`, `updateAuthOptions`, `deleteAuthOptions`

## Acceptance Criteria
- [ ] When `protectedEndpoints` is undefined/absent, all 6 auth variables resolve to empty string `""`
- [ ] When `protectedEndpoints` has endpoints set to true, `authorizerSetup` contains the full CDK authorizer block using `cdk.Fn.importValue`, `lambda.Function.fromFunctionArn`, and `apigateway.TokenAuthorizer`
- [ ] The `authorizerSetup` block uses `{{projectName}}` and `{{ModuleName}}` placeholders (resolved by the same `replaceVariables` pass)
- [ ] Per-endpoint auth options (e.g., `createAuthOptions`) contain the `, { authorizer, authorizationType: ... }` string when that endpoint is protected, empty string otherwise
- [ ] No new Lambda is created -- the authorizer block only imports the existing one from AuthStack
- [ ] `pnpm build` passes without errors

## Implementation Notes
The `authorizerSetup` value itself contains `{{projectName}}` and `{{ModuleName}}` placeholders. This works because `replaceAll` processes all keys on the full string in a single pass, so nested placeholders get resolved.

Helper function pattern:
```typescript
function authMethodOptions(isProtected: boolean): string {
  if (!isProtected) return "";
  return `, {\n      authorizer,\n      authorizationType: apigateway.AuthorizationType.CUSTOM,\n    }`;
}
```

The `authorizerSetup` block when protected:
```typescript
const authorizerFnArn = cdk.Fn.importValue(
  `{{projectName}}-AuthorizerFunctionArn-${this.stage}`
);
const authorizerFn = lambda.Function.fromFunctionArn(
  this, "ImportedAuthorizerFunction", authorizerFnArn
);
const authorizer = new apigateway.TokenAuthorizer(this, "{{ModuleName}}Authorizer", {
  handler: authorizerFn,
  identitySource: "method.request.header.Authorization",
});
```

## Estimated Complexity
Medium -- Requires careful string construction for the CDK authorizer block and per-endpoint conditional variables.

## Status
- [ ] Not Started
