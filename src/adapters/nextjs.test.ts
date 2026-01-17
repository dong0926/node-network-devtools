/**
 * Next.js 适配器测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
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

    // Property 17: Next.js 选项透传
    it('Property 17: 所有 Next.js 选项都应该被正确提取', () => {
      fc.assert(
        fc.property(
          fc.record({
            revalidate: fc.option(fc.oneof(fc.integer({ min: 0 }), fc.constant(false)), { nil: undefined }),
            tags: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }), { nil: undefined }),
            cache: fc.option(fc.constantFrom('default', 'no-store', 'reload', 'no-cache', 'force-cache'), { nil: undefined }),
          }),
          (params) => {
            const init: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {};
            
            if (params.revalidate !== undefined || params.tags !== undefined) {
              init.next = {};
              if (params.revalidate !== undefined) init.next.revalidate = params.revalidate;
              if (params.tags !== undefined) init.next.tags = params.tags;
            }
            
            if (params.cache !== undefined) {
              init.cache = params.cache as RequestCache;
            }

            const options = extractNextJsOptions(init);
            
            // 验证提取的选项与原始选项一致
            if (init.next?.revalidate !== undefined) {
              expect(options?.next?.revalidate).toBe(init.next.revalidate);
            }
            if (init.next?.tags !== undefined) {
              expect(options?.next?.tags).toEqual(init.next.tags);
            }
            if (init.cache !== undefined) {
              expect(options?.cache).toBe(init.cache);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
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

    // Property 19: Next.js 请求来源关联
    it('Property 19: 在路由上下文中的请求应该包含来源信息', () => {
      fc.assert(
        fc.property(
          fc.record({
            route: fc.string({ minLength: 1, maxLength: 50 }),
            type: fc.constantFrom('server-component', 'server-action', 'route-handler', 'middleware'),
          }),
          (params) => {
            const metadata = runWithRoute(params.route, params.type, () => {
              return extractNextJsMetadata();
            });

            expect(metadata.route).toBe(params.route);
            expect(metadata.requestType).toBe(params.type);
            return true;
          }
        ),
        { numRuns: 100 }
      );
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

  // Property 18: Next.js 缓存不干扰
  describe('Property 18: 缓存行为不干扰', () => {
    it('提取选项不应该修改原始对象', () => {
      fc.assert(
        fc.property(
          fc.record({
            revalidate: fc.option(fc.integer({ min: 0 }), { nil: undefined }),
            tags: fc.option(fc.array(fc.string(), { maxLength: 3 }), { nil: undefined }),
          }),
          (params) => {
            const original = {
              next: {
                revalidate: params.revalidate,
                tags: params.tags ? [...params.tags] : undefined,
              },
            } as RequestInit;
            
            const originalJson = JSON.stringify(original);
            
            // 提取选项
            extractNextJsOptions(original);
            extractNextJsMetadata(original);
            
            // 验证原始对象未被修改
            expect(JSON.stringify(original)).toBe(originalJson);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
