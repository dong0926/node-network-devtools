import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.property.test.ts'],
    // 属性测试可能需要更长时间
    testTimeout: 30000,
  },
});
