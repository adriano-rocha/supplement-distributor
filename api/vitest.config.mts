import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Arquivos de integracao compartilham o mesmo banco (supplement_test): rodam um por vez
    fileParallelism: false,
  },
});