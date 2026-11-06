import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "dist/**",
        "src/**/*.test.ts",
        "src/generated/**",
        "src/scripts/**",
        "src/index.ts", // Main entry point - integration tested
        "src/interlink/client.ts", // Requires external service
        "vitest.config.ts",
        "vitest.setup.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});