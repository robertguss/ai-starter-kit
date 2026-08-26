import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    exclude: [...configDefaults.exclude, "e2e/**"],
    server: { deps: { inline: ["convex-test"] } },
  },
});
