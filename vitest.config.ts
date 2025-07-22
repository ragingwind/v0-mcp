import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['./tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
  },
});
