//vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig(() => ({
  plugins: [
    tanstackStart({
      server: { entry: "server" },
      router: {
        routesDirectory: "../frontend/routes",
        generatedRouteTree: "routeTree.gen.ts",
      },
    }),
    react(),
    tailwind(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  // Disable the HMR overlay temporarily to avoid the white overlay during debugging
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
