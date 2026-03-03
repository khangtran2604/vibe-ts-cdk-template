# Task: Create monitoring template (CloudWatch)

## ID
6.3

## Description
Create the `templates/monitoring/` directory and CDK monitoring stack with CloudWatch dashboards, alarms, and log groups for the application services. Provides observability out of the box.

## Dependencies
- Task 4.1: Infra templates (monitoring stack added to CDK app)

## Inputs
- Monitoring structure from PLAN.md
- Variables: `{{projectName}}`

## Outputs / Deliverables
- `templates/monitoring/` -- Monitoring utility code (structured logging, metrics helpers)
- `templates/infra/src/stacks/monitoring-stack.ts.hbs` -- CDK CloudWatch stack

## Acceptance Criteria
- [ ] Monitoring stack creates CloudWatch dashboard with key metrics
- [ ] Alarms configured for: Lambda errors, API Gateway 5xx, Lambda duration
- [ ] Log groups created for each Lambda function with appropriate retention
- [ ] Monitoring utility provides structured JSON logging for Lambda handlers
- [ ] Stack integrates with CDK app via `// @feature:monitoring` conditional
- [ ] Dashboard is stage-aware (different thresholds for dev vs prod)

## Implementation Notes
- Use `aws-cdk-lib/aws-cloudwatch` constructs for dashboards and alarms
- Dashboard should include: Lambda invocations, errors, duration; API Gateway requests, latency, errors
- Structured logging helper should output JSON with correlation IDs, timestamp, log level
- Set log retention to 7 days for dev, 30 days for staging, 90 days for prod
- Consider adding SNS topic for alarm notifications (with placeholder email)

## Estimated Complexity
Medium -- CloudWatch CDK constructs and logging utilities

## Status
- [x] Complete
