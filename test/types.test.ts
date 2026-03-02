import { describe, it, expectTypeOf } from "vitest";
import type { Preset, FeatureFlags, ProjectConfig } from "../src/types.js";

describe("types", () => {
  describe("Preset", () => {
    it("should accept 'minimal' as a valid Preset", () => {
      const preset: Preset = "minimal";
      expectTypeOf(preset).toEqualTypeOf<Preset>();
    });

    it("should accept 'standard' as a valid Preset", () => {
      const preset: Preset = "standard";
      expectTypeOf(preset).toEqualTypeOf<Preset>();
    });

    it("should accept 'full' as a valid Preset", () => {
      const preset: Preset = "full";
      expectTypeOf(preset).toEqualTypeOf<Preset>();
    });

    it("should be a string union type", () => {
      expectTypeOf<Preset>().toEqualTypeOf<"minimal" | "standard" | "full">();
    });

    it("should not be assignable from an arbitrary string at the type level", () => {
      // Demonstrate the type is a union, not plain string
      expectTypeOf<Preset>().not.toEqualTypeOf<string>();
    });
  });

  describe("FeatureFlags", () => {
    it("should accept a fully populated FeatureFlags object", () => {
      const flags: FeatureFlags = {
        frontend: true,
        auth: false,
        e2e: true,
        database: false,
        rds: false,
        cicd: true,
        monitoring: false,
        hooks: true,
      };
      expectTypeOf(flags).toEqualTypeOf<FeatureFlags>();
    });

    it("should have boolean frontend flag", () => {
      expectTypeOf<FeatureFlags["frontend"]>().toEqualTypeOf<boolean>();
    });

    it("should have boolean auth flag", () => {
      expectTypeOf<FeatureFlags["auth"]>().toEqualTypeOf<boolean>();
    });

    it("should have boolean e2e flag", () => {
      expectTypeOf<FeatureFlags["e2e"]>().toEqualTypeOf<boolean>();
    });

    it("should have boolean database flag", () => {
      expectTypeOf<FeatureFlags["database"]>().toEqualTypeOf<boolean>();
    });

    it("should have boolean rds flag", () => {
      expectTypeOf<FeatureFlags["rds"]>().toEqualTypeOf<boolean>();
    });

    it("should have boolean cicd flag", () => {
      expectTypeOf<FeatureFlags["cicd"]>().toEqualTypeOf<boolean>();
    });

    it("should have boolean monitoring flag", () => {
      expectTypeOf<FeatureFlags["monitoring"]>().toEqualTypeOf<boolean>();
    });

    it("should have boolean hooks flag", () => {
      expectTypeOf<FeatureFlags["hooks"]>().toEqualTypeOf<boolean>();
    });

    it("should expose exactly eight keys", () => {
      // Verify the known keys are all present in the type
      type Keys = keyof FeatureFlags;
      expectTypeOf<Keys>().toEqualTypeOf<
        | "frontend"
        | "auth"
        | "e2e"
        | "database"
        | "rds"
        | "cicd"
        | "monitoring"
        | "hooks"
      >();
    });
  });

  describe("ProjectConfig", () => {
    it("should accept a fully populated ProjectConfig object", () => {
      const config: ProjectConfig = {
        projectName: "my-app",
        preset: "standard",
        awsRegion: "us-east-1",
        features: {
          frontend: true,
          auth: true,
          e2e: true,
          database: false,
          rds: false,
          cicd: false,
          monitoring: false,
          hooks: false,
        },
        gitInit: true,
        installDeps: true,
      };
      expectTypeOf(config).toEqualTypeOf<ProjectConfig>();
    });

    it("should have string projectName", () => {
      expectTypeOf<ProjectConfig["projectName"]>().toEqualTypeOf<string>();
    });

    it("should have Preset as preset field type", () => {
      expectTypeOf<ProjectConfig["preset"]>().toEqualTypeOf<Preset>();
    });

    it("should have string awsRegion", () => {
      expectTypeOf<ProjectConfig["awsRegion"]>().toEqualTypeOf<string>();
    });

    it("should have FeatureFlags as features field type", () => {
      expectTypeOf<ProjectConfig["features"]>().toEqualTypeOf<FeatureFlags>();
    });

    it("should have boolean gitInit", () => {
      expectTypeOf<ProjectConfig["gitInit"]>().toEqualTypeOf<boolean>();
    });

    it("should have boolean installDeps", () => {
      expectTypeOf<ProjectConfig["installDeps"]>().toEqualTypeOf<boolean>();
    });
  });
});
