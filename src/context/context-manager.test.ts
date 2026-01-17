/**
 * 上下文管理器测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  ContextManager,
  generateTraceId,
  getCurrentContext,
  getCurrentTraceId,
  startTrace,
  runWithContext,
  runWithTrace,
  runWithTraceAsync,
  updateContextMetadata,
  getTraceDuration,
  createTraceIdGetter,
} from './context-manager.js';

describe('ContextManager', () => {
  describe('generateTraceId', () => {
    it('应该生成以 trace_ 开头的 ID', () => {
      const traceId = generateTraceId();
      expect(traceId).toMatch(/^trace_[a-zA-Z0-9_-]+$/);
    });

    it('应该生成唯一的 ID', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateTraceId());
      }
      expect(ids.size).toBe(1000);
    });
  });

  describe('getCurrentContext / getCurrentTraceId', () => {
    it('在没有上下文时应该返回 undefined', () => {
      expect(getCurrentContext()).toBeUndefined();
      expect(getCurrentTraceId()).toBeUndefined();
    });
  });

  describe('startTrace', () => {
    it('应该创建新的追踪上下文', () => {
      const context = startTrace();
      expect(context.traceId).toMatch(/^trace_/);
      expect(context.startTime).toBeLessThanOrEqual(Date.now());
    });

    it('应该使用提供的 traceId', () => {
      const customId = 'custom_trace_123';
      const context = startTrace(customId);
      expect(context.traceId).toBe(customId);
    });

    it('应该包含元数据', () => {
      const metadata = { userId: '123', action: 'test' };
      const context = startTrace(undefined, metadata);
      expect(context.metadata).toEqual(metadata);
    });
  });

  describe('runWithContext', () => {
    it('应该在上下文中运行函数', () => {
      const context = startTrace('test_trace');
      
      const result = runWithContext(context, () => {
        return getCurrentTraceId();
      });

      expect(result).toBe('test_trace');
    });

    it('函数执行后上下文应该被清除', () => {
      const context = startTrace('test_trace');
      
      runWithContext(context, () => {
        expect(getCurrentTraceId()).toBe('test_trace');
      });

      expect(getCurrentTraceId()).toBeUndefined();
    });
  });

  describe('runWithTrace', () => {
    it('应该自动创建上下文并运行函数', () => {
      const result = runWithTrace(() => {
        const traceId = getCurrentTraceId();
        expect(traceId).toMatch(/^trace_/);
        return traceId;
      });

      expect(result).toMatch(/^trace_/);
    });

    it('应该使用提供的 traceId', () => {
      const result = runWithTrace(() => {
        return getCurrentTraceId();
      }, 'custom_id');

      expect(result).toBe('custom_id');
    });
  });

  describe('runWithTraceAsync', () => {
    it('应该在异步函数中保持上下文', async () => {
      const result = await runWithTraceAsync(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return getCurrentTraceId();
      }, 'async_trace');

      expect(result).toBe('async_trace');
    });

    it('应该在多个 await 之间保持上下文', async () => {
      const results: (string | undefined)[] = [];

      await runWithTraceAsync(async () => {
        results.push(getCurrentTraceId());
        await new Promise(resolve => setTimeout(resolve, 5));
        results.push(getCurrentTraceId());
        await new Promise(resolve => setTimeout(resolve, 5));
        results.push(getCurrentTraceId());
      }, 'multi_await_trace');

      expect(results).toEqual(['multi_await_trace', 'multi_await_trace', 'multi_await_trace']);
    });
  });

  describe('嵌套追踪', () => {
    it('应该记录父追踪 ID', () => {
      runWithTrace(() => {
        const parentId = getCurrentTraceId();
        
        runWithTrace(() => {
          const context = getCurrentContext();
          expect(context?.parentTraceId).toBe(parentId);
        });
      }, 'parent_trace');
    });
  });

  describe('updateContextMetadata', () => {
    it('应该更新当前上下文的元数据', () => {
      runWithTrace(() => {
        updateContextMetadata({ key1: 'value1' });
        expect(getCurrentContext()?.metadata).toEqual({ key1: 'value1' });

        updateContextMetadata({ key2: 'value2' });
        expect(getCurrentContext()?.metadata).toEqual({ key1: 'value1', key2: 'value2' });
      });
    });

    it('在没有上下文时不应该抛出错误', () => {
      expect(() => updateContextMetadata({ key: 'value' })).not.toThrow();
    });
  });

  describe('getTraceDuration', () => {
    it('应该返回追踪持续时间', async () => {
      await runWithTraceAsync(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        const duration = getTraceDuration();
        expect(duration).toBeGreaterThanOrEqual(50);
      });
    });

    it('在没有上下文时应该返回 undefined', () => {
      expect(getTraceDuration()).toBeUndefined();
    });
  });

  describe('createTraceIdGetter', () => {
    it('应该返回获取当前 TraceID 的函数', () => {
      const getter = createTraceIdGetter();
      expect(typeof getter).toBe('function');

      runWithTrace(() => {
        expect(getter()).toMatch(/^trace_/);
      });

      expect(getter()).toBeUndefined();
    });
  });

  describe('Property 7: 异步上下文传递', () => {
    it('上下文应该在 Promise.all 中保持', async () => {
      await runWithTraceAsync(async () => {
        const traceId = getCurrentTraceId();
        
        const results = await Promise.all([
          (async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return getCurrentTraceId();
          })(),
          (async () => {
            await new Promise(resolve => setTimeout(resolve, 20));
            return getCurrentTraceId();
          })(),
        ]);

        expect(results).toEqual([traceId, traceId]);
      });
    });
  });

  describe('Property 8: TraceID 唯一性', () => {
    it('生成的 TraceID 应该唯一', () => {
      fc.assert(
        fc.property(fc.integer({ min: 100, max: 1000 }), (count) => {
          const ids = new Set<string>();
          for (let i = 0; i < count; i++) {
            ids.add(generateTraceId());
          }
          return ids.size === count;
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('ContextManager 对象', () => {
    it('应该导出所有必要的方法', () => {
      expect(typeof ContextManager.generateTraceId).toBe('function');
      expect(typeof ContextManager.getCurrentContext).toBe('function');
      expect(typeof ContextManager.getCurrentTraceId).toBe('function');
      expect(typeof ContextManager.startTrace).toBe('function');
      expect(typeof ContextManager.runWithContext).toBe('function');
      expect(typeof ContextManager.runWithTrace).toBe('function');
      expect(typeof ContextManager.runWithTraceAsync).toBe('function');
      expect(typeof ContextManager.updateContextMetadata).toBe('function');
      expect(typeof ContextManager.getTraceDuration).toBe('function');
      expect(typeof ContextManager.createTraceIdGetter).toBe('function');
    });
  });
});
