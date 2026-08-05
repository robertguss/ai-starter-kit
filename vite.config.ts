import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

export default defineConfig({
  server: {
    port: 3000,
  },
  envPrefix: ['VITE_'],
  plugins: [
    tailwindcss(),
    tanstackStart({ srcDirectory: 'app' }),
    viteReact(),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: [
      // Clerk / React 19: some deps still import the external-store shim path.
      // React 19 bundles that API; alias avoids a duplicate/broken shim resolution.
      {
        find: 'use-sync-external-store/shim/index.js',
        replacement: 'react',
      },
    ],
  },
})
