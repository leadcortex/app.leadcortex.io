// vite.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => ({
  plugins: [
    tanstackStart({
      server: { entry: "server" },
      router: {
        routesDirectory: "../frontend/routes",
        generatedRouteTree: "routeTree.gen.ts",
        routeTreeFileHeader: [
          "// src/routeTree.gen.ts",
          "/* eslint-disable */",
          "// @ts-nocheck",
          "// noinspection JSUnusedGlobalSymbols",
        ],
      },
    }),
    react(),
    tailwind(),
    tsconfigPaths(),
  ],
  server: {
    port: 3000,
    proxy: {
      "/api/v1": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: false,
    },
  },
}));
