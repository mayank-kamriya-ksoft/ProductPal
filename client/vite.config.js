import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve("src"),
      "@shared": path.resolve("../shared"),
      "@assets": path.resolve("../attached_assets"),
    },
  },
  root: ".", // Build from client directory
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
  },
  base: "./", // Use relative paths
});