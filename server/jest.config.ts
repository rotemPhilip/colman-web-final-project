import type { Config } from "jest";

process.env.NODE_ENV = "test";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  testTimeout: 30000,
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  // Run test files sequentially to share a single MongoDB instance
  maxWorkers: 1,
};

export default config;
