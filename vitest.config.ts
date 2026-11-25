// vitest.config.ts
// Config des tests. Le reporter TDD Guard transmet les résultats au garde-fou
// TDD de Claude Code (.claude/tdd-guard/data).

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitestReporter } from "tdd-guard-vitest";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    reporters: ["default", new VitestReporter(import.meta.dirname)],
  },
});
