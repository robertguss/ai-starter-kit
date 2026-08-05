/// <reference types="vite/client" />

// Export modules glob for convex-test
// This glob matches all Convex source files (.ts, .tsx, .js, .jsx) while
// excluding generated declaration files, test files, and config files.
export const modules = import.meta.glob([
  "./**/*.ts",
  "./**/*.tsx",
  "./**/*.js",
  "./**/*.jsx",
  "!./**/*.test.*",
  "!./**/*.config.*",
  "!./**/*.d.ts",
]);
