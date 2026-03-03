# Task: Create CDK Infrastructure Stack Template

## ID
2.3

## Description
Create the CDK stack template at `templates/generators/infra-stack/stack.ts.hbs` that defines the AWS infrastructure for a generated CRUD service module. This follows the stack-per-service pattern and creates Lambda functions, API Gateway, and CloudWatch log group.

## Dependencies
- Task 1.2: Needs the variable map keys from `getModuleVariableMap()` for correct placeholder names

## Inputs
- Variable map keys: `moduleName`, `ModuleName`, `entityName`, `port`
- Existing `templates/infra/src/stacks/` as reference for the stack-per-service pattern
- CLAUDE.md rules: stack-per-service, each service gets its own API Gateway

## Outputs / Deliverables
- New file `templates/generators/infra-stack/stack.ts.hbs`

## Acceptance Criteria
- [ ] Stack class extends the base stack class used in the project (e.g., `cdk.Stack` or a custom `ServiceStack`)
- [ ] Creates a CloudWatch LogGroup for the service
- [ ] Creates 5 NodejsFunction constructs (create, get, list, update, delete) pointing to `services/{{moduleName}}/src/handlers/*.ts`
- [ ] Creates a RestApi with CRUD resource routes
- [ ] Creates a CfnOutput for the API URL
- [ ] Uses `{{ModuleName}}Stack` as the stack class name
- [ ] All `{{variable}}` placeholders match the variable map keys
- [ ] Template follows the same patterns as existing stacks in `templates/infra/src/stacks/`

## Implementation Notes
- Study existing stack templates in `templates/infra/src/stacks/` to match the constructor pattern, prop types, and CDK construct conventions used in the project.
- Each Lambda should have its `entry` pointing to the correct handler file path relative to the project root.
- The API Gateway should have resources like `/{{moduleName}}` and `/{{moduleName}}/{id}` with appropriate method integrations.
- Keep the stack self-contained -- it should not depend on resources from other stacks (per the stack-per-service principle).

## Estimated Complexity
Medium -- Single file but requires accurate CDK construct definitions with correct resource wiring.

## Status
- [ ] Not Started
