# Task: Create database template (DynamoDB + optional RDS)

## ID
6.1

## Description
Create the `templates/database/` directory and CDK database stack. This includes DynamoDB table definitions as the default, with optional RDS Aurora Serverless v2 support when the `--rds` flag is used. Also update the users service handlers to reference database constructs.

## Dependencies
- Task 4.3: Users service template (database integrates with CRUD handlers)
- Task 4.1: Infra templates (database stack added to CDK app)

## Inputs
- Database architecture from PLAN.md: DynamoDB default + optional RDS
- Variables: `{{projectName}}`
- RDS conditional via `// @feature:rds` pattern

## Outputs / Deliverables
- `templates/database/` -- Database utility/client code for services to use
- `templates/infra/src/stacks/database-stack.ts.hbs` -- CDK stack for DynamoDB + optional RDS
- Updates to users service handlers for database references (via `// @feature:database` conditionals already in place)

## Acceptance Criteria
- [ ] Database stack creates a DynamoDB Users table with appropriate key schema
- [ ] When `rds` feature is enabled, stack also creates Aurora Serverless v2 cluster
- [ ] RDS resources use `// @feature:rds` conditionals
- [ ] Database stack exports table names/ARNs for service stacks to reference
- [ ] Service Lambda functions get proper IAM permissions to access DynamoDB
- [ ] Database utility code provides a typed client interface for services
- [ ] `cdk.RemovalPolicy.DESTROY` for dev stage, `RETAIN` for prod

## Implementation Notes
- DynamoDB: Create a Users table with `pk` (partition key) and `sk` (sort key) for flexible querying
- RDS Aurora Serverless v2: Use `ServerlessCluster` with auto-pause for cost savings in dev
- The database client code in `templates/database/` should abstract DynamoDB DocumentClient usage
- Lambda functions need environment variables for table name and IAM permissions
- Consider adding a `packages/database-client/` shared package for typed DB access

## Estimated Complexity
High -- DynamoDB + conditional RDS with CDK IAM integration

## Status
- [x] Complete
