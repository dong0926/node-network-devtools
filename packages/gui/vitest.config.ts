import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.property.test.ts'],
    // 属性测试可能需要更长时间
    testTimeout: 30000,
  },
});
