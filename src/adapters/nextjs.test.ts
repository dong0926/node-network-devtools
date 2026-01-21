/**
 * Next.js 适配器测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isNextJsEnvironment,
  getCurrentRoute,
  runWithRoute,
  runWithRouteAsync,
  extractNextJsOptions,
  extractNextJsMetadata,
  createInstrumentationConfig,
} from './nextjs.js';

describe('NextJsAdapter', () => {
  // 保存原始环境变量
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // 清理 Next.js 相关环境变量
    delete process.env.NEXT_RUNTIME;
    delete process.env.__NEXT_PRIVATE_PREBUNDLED_REACT;
    delete process.env.NEXT_DEPLOYMENT_ID;
  });

  afterEach(() => {
    // 恢复环境变量
    process.env = { ...originalEnv };
  });

  describe('isNextJsEnvironment', () => {
    it('在没有 Next.js 环境变量时应该返回 false', () => {
      expect(isNextJsEnvironment()).toBe(false);
    });

    it('在有 NEXT_RUNTIME 时应该返回 true', () => {
      process.env.NEXT_RUNTIME = 'nodejs';
      expect(isNextJsEnvironment()).toBe(true);
    });

    it('在有 __NEXT_PRIVATE_PREBUNDLED_REACT 时应该返回 true', () => {
      process.env.__NEXT_PRIVATE_PREBUNDLED_REACT = 'true';
      expect(isNextJsEnvironment()).toBe(true);
    });

    it('在有 NEXT_DEPLOYMENT_ID 时应该返回 true', () => {
      process.env.NEXT_DEPLOYMENT_ID = 'deploy-123';
      expect(isNextJsEnvironment()).toBe(true);
    });
  });

  describe('路由上下文', () => {
    it('在没有上下文时 getCurrentRoute 应该返回 undefined', () => {
      expect(getCurrentRoute()).toBeUndefined();
    });

    it('runWithRoute 应该设置路由上下文', () => {
      const result = runWithRoute('/api/users', 'route-handler', () => {
        const route = getCurrentRoute();
        return route;
      });

      expect(result).toEqual({ route: '/api/users', type: 'route-handler' });
    });

    it('runWithRouteAsync 应该在异步函数中保持上下文', async () => {
      const result = await runWithRouteAsync('/dashboard', 'server-component', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return getCurrentRoute();
      });

      expect(result).toEqual({ route: '/dashboard', type: 'server-component' });
    });

    it('嵌套的路由上下文应该正确隔离', () => {
      runWithRoute('/outer', 'server-component', () => {
        expect(getCurrentRoute()?.route).toBe('/outer');
        
        runWithRoute('/inner', 'server-action', () => {
          expect(getCurrentRoute()?.route).toBe('/inner');
        });
        
        expect(getCurrentRoute()?.route).toBe('/outer');
      });
    });
  });


  describe('extractNextJsOptions', () => {
    it('在没有 init 时应该返回 undefined', () => {
      expect(extractNextJsOptions()).toBeUndefined();
    });

    it('在没有 next 选项时应该返回 undefined', () => {
      expect(extractNextJsOptions({})).toBeUndefined();
    });

    it('应该提取 next.revalidate 选项', () => {
      const init = { next: { revalidate: 60 } } as RequestInit;
      const options = extractNextJsOptions(init);
      expect(options?.next?.revalidate).toBe(60);
    });

    it('应该提取 next.tags 选项', () => {
      const init = { next: { tags: ['users', 'posts'] } } as RequestInit;
      const options = extractNextJsOptions(init);
      expect(options?.next?.tags).toEqual(['users', 'posts']);
    });

    it('应该提取 cache 选项', () => {
      const init = { cache: 'no-store' } as RequestInit;
      const options = extractNextJsOptions(init);
      expect(options?.cache).toBe('no-store');
    });

    it('所有 Next.js 选项都应该被正确提取', () => {
      const testCases = [
        { next: { revalidate: 0 }, cache: 'default' },
        { next: { revalidate: false, tags: ['a'] }, cache: 'no-store' },
        { next: { revalidate: 100, tags: ['a', 'b'] } }
      ];

      for (const init of testCases) {
        const options = extractNextJsOptions(init as any);
        if (init.next) {
          expect(options?.next?.revalidate).toBe(init.next.revalidate);
          expect(options?.next?.tags).toEqual(init.next.tags);
        }
        if (init.cache) {
          expect(options?.cache).toBe(init.cache);
        }
      }
    });
  });

  describe('extractNextJsMetadata', () => {
    it('在没有参数时应该返回空对象', () => {
      const metadata = extractNextJsMetadata();
      expect(metadata).toEqual({});
    });

    it('应该包含路由信息', () => {
      const metadata = runWithRoute('/api/data', 'route-handler', () => {
        return extractNextJsMetadata();
      });

      expect(metadata.route).toBe('/api/data');
      expect(metadata.requestType).toBe('route-handler');
    });

    it('应该提取 revalidate 和 tags', () => {
      const init = { next: { revalidate: 3600, tags: ['data'] } } as RequestInit;
      const metadata = extractNextJsMetadata(init);
      
      expect(metadata.revalidate).toBe(3600);
      expect(metadata.tags).toEqual(['data']);
    });

    it('在路由上下文中的请求应该包含来源信息', () => {
      const route = '/test-route';
      const type = 'server-component';
      const metadata = runWithRoute(route, type as any, () => {
        return extractNextJsMetadata();
      });

      expect(metadata.route).toBe(route);
      expect(metadata.requestType).toBe(type);
    });
  });

  describe('createInstrumentationConfig', () => {
    it('应该生成有效的 instrumentation 配置', () => {
      const config = createInstrumentationConfig();
      
      expect(config).toContain('instrumentation.ts');
      expect(config).toContain('register');
      expect(config).toContain('NEXT_RUNTIME');
      expect(config).toContain('node-network-devtools');
    });
  });

  describe('缓存行为不干扰', () => {
    it('提取选项不应该修改原始对象', () => {
      const original = {
        next: {
          revalidate: 60,
          tags: ['test'],
        },
      } as RequestInit;
      
      const originalJson = JSON.stringify(original);
      
      // 提取选项
      extractNextJsOptions(original);
      extractNextJsMetadata(original);
      
      // 验证原始对象未被修改
      expect(JSON.stringify(original)).toBe(originalJson);
    });
  });
});