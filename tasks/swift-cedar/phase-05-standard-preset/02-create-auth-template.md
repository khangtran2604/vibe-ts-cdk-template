# Task: Create Cognito auth template

## ID
5.2

## Description
Create the `templates/auth/` directory with a Cognito Lambda authorizer and the corresponding CDK auth stack. The authorizer validates JWT tokens from Cognito and returns an IAM policy for API Gateway authorization.

## Dependencies
- Task 4.1: Infra templates (auth stack integrates with CDK app)

## Inputs
- Auth structure from PLAN.md
- Variables: `{{projectName}}`

## Outputs / Deliverables
- `templates/auth/package.json.hbs`
- `templates/auth/tsconfig.json`
- `templates/auth/src/authorizer.ts` -- Lambda authorizer handler
- `templates/auth/src/__tests__/authorizer.test.ts`
- `templates/infra/src/stacks/auth-stack.ts.hbs` -- CDK Cognito + Authorizer stack

## Acceptance Criteria
- [ ] Authorizer handler validates JWT tokens and returns IAM Allow/Deny policy
- [ ] Auth stack creates Cognito UserPool, UserPoolClient, and Lambda authorizer
- [ ] Unit test verifies authorizer with valid and invalid tokens
- [ ] Auth stack exports UserPool ID and client ID for use by other stacks
- [ ] `package.json` has appropriate dependencies for JWT validation
- [ ] Stack integrates with the CDK app entry point via `// @feature:auth` conditional

## Implementation Notes
- The authorizer should use `aws-jwt-verify` or manual JWT validation against Cognito JWKS
- Keep the authorizer implementation straightforward -- validate token, extract claims, return policy
- The CDK auth stack should export values that service stacks can import for securing endpoints
- Test should mock the JWT validation to avoid needing real Cognito tokens

## Estimated Complexity
Medium -- JWT validation logic and CDK Cognito constructs

## Status
- [ ] Not Started
