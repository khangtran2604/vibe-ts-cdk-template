import * as cdk from "aws-cdk-lib";
import * as logs from "aws-cdk-lib/aws-logs";
import type { Construct } from "constructs";
import type { StageConfig } from "../config";

/**
 * Props shared by all service stacks in this project.
 *
 * Extends the standard CDK StackProps so that stage-specific configuration
 * is always available inside every stack constructor without needing to
 * thread it through separate parameters.
 */
export interface ServiceStackProps extends cdk.StackProps {
  /** The deployment stage (dev | staging | prod) */
  stage: string;
  /** Resolved stage configuration */
  config: StageConfig;
}

/**
 * Abstract base class for all service stacks.
 *
 * Provides:
 * - Typed access to {@link stage} and {@link config} throughout subclasses.
 * - A helper {@link removalPolicy} that returns DESTROY for dev and RETAIN
 *   for staging/prod to protect stateful resources.
 * - A helper {@link resourceName} that generates consistent, stage-scoped
 *   resource names: `<logicalId>-<stage>`.
 */
export abstract class ServiceStack extends cdk.Stack {
  protected readonly stage: string;
  protected readonly config: StageConfig;

  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);
    this.stage = props.stage;
    this.config = props.config;
  }

  /**
   * Returns the appropriate CDK removal policy for the current stage.
   * Use this on stateful resources (DynamoDB tables, S3 buckets, etc.).
   */
  protected get removalPolicy(): cdk.RemovalPolicy {
    return this.config.isDev
      ? cdk.RemovalPolicy.DESTROY
      : cdk.RemovalPolicy.RETAIN;
  }

  /**
   * Generates a stage-scoped physical resource name.
   *
   * @param logicalId - A short logical identifier (e.g. "health-api").
   * @returns A string in the form `<logicalId>-<stage>`.
   *
   * @example
   * this.resourceName("health-api") // "health-api-dev"
   */
  protected resourceName(logicalId: string): string {
    return `${logicalId}-${this.stage}`;
  }

  /**
   * Maps {@link StageConfig.logRetentionDays} to the nearest CDK
   * {@link logs.RetentionDays} enum member.
   *
   * Centralised here so that all service stacks use a consistent retention
   * policy derived from the stage configuration rather than hardcoded values.
   */
  protected logRetention(): logs.RetentionDays {
    const days = this.config.logRetentionDays;
    if (days <= 7) return logs.RetentionDays.ONE_WEEK;
    if (days <= 30) return logs.RetentionDays.ONE_MONTH;
    if (days <= 90) return logs.RetentionDays.THREE_MONTHS;
    return logs.RetentionDays.SIX_MONTHS;
  }
}
