import { describe, it, expect } from "vitest";
import { CLI_NAME, CLI_VERSION, DEFAULT_REGION } from "../src/constants.js";

describe("constants", () => {
  describe("CLI_NAME", () => {
    it('should equal "vibe-ts-cdk-template"', () => {
      expect(CLI_NAME).toBe("vibe-ts-cdk-template");
    });

    it("should be a string", () => {
      expect(typeof CLI_NAME).toBe("string");
    });
  });

  describe("CLI_VERSION", () => {
    it('should equal "0.1.0"', () => {
      expect(CLI_VERSION).toBe("0.1.0");
    });

    it("should follow semver major.minor.patch format", () => {
      expect(CLI_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe("DEFAULT_REGION", () => {
    it('should equal "us-east-1"', () => {
      expect(DEFAULT_REGION).toBe("us-east-1");
    });

    it("should follow AWS region format", () => {
      // AWS regions follow the pattern: area-direction-number (e.g. us-east-1)
      expect(DEFAULT_REGION).toMatch(/^[a-z]+-[a-z]+-\d+$/);
    });
  });
});
