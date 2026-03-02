# Task: Create CDK frontend stack template

## ID
5.4

## Description
Create the CDK frontend stack that deploys the Vite React app using AWS Amplify Hosting. This stack is conditionally included via the `// @feature:frontend` pattern in the CDK app entry point.

## Dependencies
- Task 4.1: Infra templates and CDK app structure
- Task 5.1: Frontend template (deployed by this stack)

## Inputs
- CDK Amplify Hosting constructs
- Variables: `{{projectName}}`, `{{awsRegion}}`

## Outputs / Deliverables
- `templates/infra/src/stacks/frontend-stack.ts.hbs`

## Acceptance Criteria
- [ ] Stack creates an Amplify App connected to the frontend workspace
- [ ] Build settings configured for Vite (build command, output directory)
- [ ] Stack accepts stage parameter for environment-specific configuration
- [ ] Stack exports the Amplify app URL
- [ ] Integrates with CDK app entry via `// @feature:frontend` conditional

## Implementation Notes
- Use `@aws-cdk/aws-amplify-alpha` or the L2 constructs available in `aws-cdk-lib`
- Amplify Hosting can be configured for manual deploys or connected to a Git repo
- For the template, configure it for manual/CLI deploys since there's no repo connection at scaffold time
- Consider using S3 + CloudFront as an alternative if Amplify constructs are limited

## Estimated Complexity
Medium -- CDK Amplify constructs with stage-based configuration

## Status
- [x] Complete
