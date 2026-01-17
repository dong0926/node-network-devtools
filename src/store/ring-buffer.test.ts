/**
 * 环形缓冲区测试
 * 
 * **Property 13: 环形缓冲区大小限制**
 * **Property 14: Body 截断正确性**
 * **Property 15: 查询功能正确性**
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { 
  createRequestStore, 
  type RequestData, 
  type ResponseData,
  type IRequestStore 
} from './ring-buffer.js';

// 生成随机请求数据的 Arbitrary
const requestDataArb = fc.record({
  id: fc.uuid(),
  traceId: fc.option(fc.uuid(), { nil: undefined }),
  url: fc.webUrl(),
  method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
  headers: fc.dictionary(
    fc.stringMatching(/^[a-z][a-z0-9-]*$/),
    fc.string({ minLength: 1, maxLength: 100 })
  ),
  body: fc.option(fc.string({ minLength: 0, maxLength: 1000 }), { nil: undefined }),
  stackTrace: fc.string({ minLength: 10, maxLength: 500 }),
  timestamp: fc.integer({ min: 0, max: Date.now() + 1000000 }),
}) as fc.Arbitrary<RequestData>;

// 生成随机响应数据的 Arbitrary
const responseDataArb = fc.record({
  statusCode: fc.integer({ min: 100, max: 599 }),
  statusMessage: fc.string({ minLength: 1, maxLength: 50 }),
  headers: fc.dictionary(
    fc.stringMatching(/^[a-z][a-z0-9-]*$/),
    fc.string({ minLength: 1, maxLength: 100 })
  ),
  body: fc.option(fc.string({ minLength: 0, maxLength: 1000 }), { nil: undefined }),
}) as fc.Arbitrary<ResponseData>;

describe('RingBufferStore', () => {
  let store: IRequestStore;

  beforeEach(() => {
    store = createRequestStore(100, 1024); // 小缓冲区用于测试
  });

  describe('基础功能', () => {
    it('should add and retrieve request', () => {
      const request: RequestData = {
        id: 'req_1',
        url: 'https://example.com/api',
        method: 'GET',
        headers: {},
        stackTrace: 'at test.js:1',
        timestamp: Date.now(),
      };

      store.add(request);
      const retrieved = store.get('req_1');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('req_1');
      expect(retrieved?.url).toBe('https://example.com/api');
    });

    it('should return undefined for non-existent request', () => {
      expect(store.get('non_existent')).toBeUndefined();
    });

    it('should clear all requests', () => {
      store.add({ id: 'req_1', url: 'https://a.com', method: 'GET', headers: {}, stackTrace: '', timestamp: 0 });
      store.add({ id: 'req_2', url: 'https://b.com', method: 'GET', headers: {}, stackTrace: '', timestamp: 0 });
      
      expect(store.size()).toBe(2);
      store.clear();
      expect(store.size()).toBe(0);
      expect(store.get('req_1')).toBeUndefined();
    });

    it('should update response', () => {
      store.add({ id: 'req_1', url: 'https://a.com', method: 'GET', headers: {}, stackTrace: '', timestamp: 0 });
      
      store.updateResponse('req_1', {
        statusCode: 200,
        statusMessage: 'OK',
        headers: { 'content-type': 'application/json' },
      });

      const request = store.get('req_1');
      expect(request?.response?.statusCode).toBe(200);
    });

    it('should update error', () => {
      store.add({ id: 'req_1', url: 'https://a.com', method: 'GET', headers: {}, stackTrace: '', timestamp: 0 });
      
      store.updateError('req_1', {
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      });

      const request = store.get('req_1');
      expect(request?.error?.code).toBe('ECONNREFUSED');
    });
  });

  /**
   * Property 13: 环形缓冲区大小限制
   * 
   * *For any* 数量的请求添加到缓冲区，缓冲区中存储的请求数量应该不超过配置的最大值，
   * 且最新的请求应该始终可访问。
   */
  describe('Property 13: 环形缓冲区大小限制', () => {
    it('should never exceed max size', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // maxSize
          fc.integer({ min: 1, max: 200 }), // 添加的请求数量
          (maxSize, numRequests) => {
            const testStore = createRequestStore(maxSize, 1024 * 1024);
            
            for (let i = 0; i < numRequests; i++) {
              testStore.add({
                id: `req_${i}`,
                url: `https://example.com/${i}`,
                method: 'GET',
                headers: {},
                stackTrace: '',
                timestamp: i,
              });
            }

            // 缓冲区大小不应超过 maxSize
            return testStore.size() <= maxSize;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always keep the most recent requests accessible', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 50 }), // maxSize
          fc.integer({ min: 10, max: 200 }), // 添加的请求数量
          (maxSize, numRequests) => {
            const testStore = createRequestStore(maxSize, 1024 * 1024);
            
            for (let i = 0; i < numRequests; i++) {
              testStore.add({
                id: `req_${i}`,
                url: `https://example.com/${i}`,
                method: 'GET',
                headers: {},
                stackTrace: '',
                timestamp: i,
              });
            }

            // 最新的请求应该始终可访问
            const lastId = `req_${numRequests - 1}`;
            const lastRequest = testStore.get(lastId);
            return lastRequest !== undefined && lastRequest.id === lastId;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should overwrite oldest entries when full', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 20 }), // maxSize
          (maxSize) => {
            const testStore = createRequestStore(maxSize, 1024 * 1024);
            const totalRequests = maxSize * 2;
            
            for (let i = 0; i < totalRequests; i++) {
              testStore.add({
                id: `req_${i}`,
                url: `https://example.com/${i}`,
                method: 'GET',
                headers: {},
                stackTrace: '',
                timestamp: i,
              });
            }

            // 最旧的请求应该被覆盖
            const oldestId = `req_0`;
            const oldestRequest = testStore.get(oldestId);
            
            // 最新的请求应该存在
            const newestId = `req_${totalRequests - 1}`;
            const newestRequest = testStore.get(newestId);

            return oldestRequest === undefined && newestRequest !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 14: Body 截断正确性
   * 
   * *For any* body 大小超过配置限制的请求，存储的 body 应该被截断到限制大小，
   * 且 bodyTruncated 标志应该为 true。
   */
  describe('Property 14: Body 截断正确性', () => {
    it('should truncate body exceeding max size and set flag', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000 }), // maxBodySize
          fc.integer({ min: 1, max: 5 }), // 超出倍数
          (maxBodySize, multiplier) => {
            const testStore = createRequestStore(100, maxBodySize);
            const bodySize = maxBodySize * multiplier + 50; // 确保超过限制
            const largeBody = 'x'.repeat(bodySize);

            testStore.add({
              id: 'req_large',
              url: 'https://example.com',
              method: 'POST',
              headers: {},
              body: largeBody,
              stackTrace: '',
              timestamp: 0,
            });

            const request = testStore.get('req_large');
            if (!request) return false;

            // body 应该被截断
            const storedBodySize = request.body ? Buffer.byteLength(request.body) : 0;
            const isTruncated = storedBodySize <= maxBodySize;
            const flagSet = request.bodyTruncated === true;

            return isTruncated && flagSet;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not truncate body within limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000 }), // maxBodySize
          fc.integer({ min: 1, max: 99 }), // body 大小百分比
          (maxBodySize, percentage) => {
            const testStore = createRequestStore(100, maxBodySize);
            const bodySize = Math.floor(maxBodySize * percentage / 100);
            const body = 'x'.repeat(bodySize);

            testStore.add({
              id: 'req_small',
              url: 'https://example.com',
              method: 'POST',
              headers: {},
              body,
              stackTrace: '',
              timestamp: 0,
            });

            const request = testStore.get('req_small');
            if (!request) return false;

            // body 不应该被截断
            return request.body === body && request.bodyTruncated !== true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should truncate response body as well', () => {
      const maxBodySize = 100;
      const testStore = createRequestStore(100, maxBodySize);
      const largeBody = 'y'.repeat(maxBodySize * 2);

      testStore.add({
        id: 'req_1',
        url: 'https://example.com',
        method: 'GET',
        headers: {},
        stackTrace: '',
        timestamp: 0,
      });

      testStore.updateResponse('req_1', {
        statusCode: 200,
        statusMessage: 'OK',
        headers: {},
        body: largeBody,
      });

      const request = testStore.get('req_1');
      expect(request?.response?.bodyTruncated).toBe(true);
      expect(Buffer.byteLength(request?.response?.body || '')).toBeLessThanOrEqual(maxBodySize);
    });
  });

  /**
   * Property 15: 查询功能正确性
   * 
   * *For any* 存储在缓冲区中的请求，通过 ID、TraceID、URL 模式或状态码查询
   * 应该能够正确返回匹配的请求。
   */
  describe('Property 15: 查询功能正确性', () => {
    it('should find request by ID', () => {
      fc.assert(
        fc.property(
          fc.array(requestDataArb, { minLength: 1, maxLength: 50 }),
          (requests) => {
            const testStore = createRequestStore(100, 1024 * 1024);
            
            for (const req of requests) {
              testStore.add(req);
            }

            // 随机选择一个请求进行查询
            const targetRequest = requests[requests.length - 1]; // 最后一个肯定在
            const found = testStore.get(targetRequest.id);

            return found !== undefined && found.id === targetRequest.id;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should find requests by TraceID', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // traceId
          fc.integer({ min: 1, max: 10 }), // 同一 trace 的请求数
          fc.integer({ min: 0, max: 10 }), // 其他请求数
          (traceId, sameTraceCount, otherCount) => {
            const testStore = createRequestStore(100, 1024 * 1024);
            
            // 添加同一 trace 的请求
            for (let i = 0; i < sameTraceCount; i++) {
              testStore.add({
                id: `same_${i}`,
                traceId,
                url: `https://example.com/${i}`,
                method: 'GET',
                headers: {},
                stackTrace: '',
                timestamp: i,
              });
            }

            // 添加其他请求
            for (let i = 0; i < otherCount; i++) {
              testStore.add({
                id: `other_${i}`,
                traceId: `other_trace_${i}`,
                url: `https://other.com/${i}`,
                method: 'GET',
                headers: {},
                stackTrace: '',
                timestamp: i + sameTraceCount,
              });
            }

            const results = testStore.getByTraceId(traceId);
            
            // 应该找到所有同一 trace 的请求
            return results.length === sameTraceCount && 
                   results.every(r => r.traceId === traceId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should find requests by URL pattern', () => {
      const testStore = createRequestStore(100, 1024 * 1024);
      
      testStore.add({ id: 'api_1', url: 'https://api.example.com/users', method: 'GET', headers: {}, stackTrace: '', timestamp: 0 });
      testStore.add({ id: 'api_2', url: 'https://api.example.com/posts', method: 'GET', headers: {}, stackTrace: '', timestamp: 1 });
      testStore.add({ id: 'cdn_1', url: 'https://cdn.example.com/image.png', method: 'GET', headers: {}, stackTrace: '', timestamp: 2 });

      const apiResults = testStore.query({ urlPattern: /api\.example\.com/ });
      expect(apiResults.length).toBe(2);
      expect(apiResults.every(r => r.url.includes('api.example.com'))).toBe(true);

      const cdnResults = testStore.query({ urlPattern: 'cdn' });
      expect(cdnResults.length).toBe(1);
    });

    it('should find requests by status code', () => {
      const testStore = createRequestStore(100, 1024 * 1024);
      
      testStore.add({ id: 'req_1', url: 'https://a.com', method: 'GET', headers: {}, stackTrace: '', timestamp: 0 });
      testStore.add({ id: 'req_2', url: 'https://b.com', method: 'GET', headers: {}, stackTrace: '', timestamp: 1 });
      testStore.add({ id: 'req_3', url: 'https://c.com', method: 'GET', headers: {}, stackTrace: '', timestamp: 2 });

      testStore.updateResponse('req_1', { statusCode: 200, statusMessage: 'OK', headers: {} });
      testStore.updateResponse('req_2', { statusCode: 404, statusMessage: 'Not Found', headers: {} });
      testStore.updateResponse('req_3', { statusCode: 500, statusMessage: 'Error', headers: {} });

      const okResults = testStore.query({ statusCode: 200 });
      expect(okResults.length).toBe(1);
      expect(okResults[0].id).toBe('req_1');

      const errorResults = testStore.query({ statusCodeMin: 400 });
      expect(errorResults.length).toBe(2);
    });

    it('should find requests by method', () => {
      const testStore = createRequestStore(100, 1024 * 1024);
      
      testStore.add({ id: 'get_1', url: 'https://a.com', method: 'GET', headers: {}, stackTrace: '', timestamp: 0 });
      testStore.add({ id: 'post_1', url: 'https://b.com', method: 'POST', headers: {}, stackTrace: '', timestamp: 1 });
      testStore.add({ id: 'get_2', url: 'https://c.com', method: 'GET', headers: {}, stackTrace: '', timestamp: 2 });

      const getResults = testStore.query({ method: 'GET' });
      expect(getResults.length).toBe(2);
      expect(getResults.every(r => r.method === 'GET')).toBe(true);
    });

    it('should combine multiple filters', () => {
      const testStore = createRequestStore(100, 1024 * 1024);
      
      testStore.add({ id: 'req_1', traceId: 'trace_1', url: 'https://api.com/users', method: 'GET', headers: {}, stackTrace: '', timestamp: 0 });
      testStore.add({ id: 'req_2', traceId: 'trace_1', url: 'https://api.com/posts', method: 'POST', headers: {}, stackTrace: '', timestamp: 1 });
      testStore.add({ id: 'req_3', traceId: 'trace_2', url: 'https://api.com/users', method: 'GET', headers: {}, stackTrace: '', timestamp: 2 });

      testStore.updateResponse('req_1', { statusCode: 200, statusMessage: 'OK', headers: {} });
      testStore.updateResponse('req_2', { statusCode: 201, statusMessage: 'Created', headers: {} });
      testStore.updateResponse('req_3', { statusCode: 200, statusMessage: 'OK', headers: {} });

      const results = testStore.query({ 
        traceId: 'trace_1', 
        method: 'GET',
        statusCode: 200 
      });
      
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('req_1');
    });
  });

  describe('getAll', () => {
    it('should return all requests in reverse chronological order', () => {
      const testStore = createRequestStore(100, 1024 * 1024);
      
      for (let i = 0; i < 5; i++) {
        testStore.add({
          id: `req_${i}`,
          url: `https://example.com/${i}`,
          method: 'GET',
          headers: {},
          stackTrace: '',
          timestamp: i,
        });
      }

      const all = testStore.getAll();
      expect(all.length).toBe(5);
      // 最新的在前面
      expect(all[0].id).toBe('req_4');
      expect(all[4].id).toBe('req_0');
    });
  });
});
