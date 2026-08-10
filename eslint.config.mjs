import { defineConfig, globalIgnores } from "eslint/config";
import convexPlugin from "@convex-dev/eslint-plugin";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "node_modules/**",
    "convex/_generated/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    ".output/**",
    ".nitro/**",
    ".next/**",
    ".vercel/**",
    ".tanstack/**",
    ".audit/**",
    "server/build/**",
    "public/build/**",
    "app/routeTree.gen.ts",
    "*.tsbuildinfo",
  ]),
  ...tseslint.config(tseslint.configs.recommended),
  ...convexPlugin.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);
