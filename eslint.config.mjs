import { defineConfig, globalIgnores } from "eslint/config";
import clerkNext from "@clerk/eslint-plugin/next";
import convexPlugin from "@convex-dev/eslint-plugin";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    "node_modules/**",
    "convex/_generated/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    ".next/**",
    ".vercel/**",
    ".audit/**",
    "playwright-report/**",
    "test-results/**",
    "*.tsbuildinfo",
  ]),
  ...convexPlugin.configs.recommended,
  {
    plugins: { "@clerk/next": clerkNext },
    rules: {
      "@clerk/next/require-auth-protection": [
        "error",
        {
          protected: ["**"],
          public: ["app", "app/(auth)/**", "app/api/health/**"],
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);
