/**
 * 环形缓冲区测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createRequestStore, 
  type RequestData, 
  type IRequestStore 
} from './ring-buffer.js';

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

  describe('环形缓冲区大小限制', () => {
    it('不应超过最大限制', () => {
      const maxSize = 10;
      const testStore = createRequestStore(maxSize, 1024 * 1024);
      
      for (let i = 0; i < 20; i++) {
        testStore.add({
          id: `req_${i}`,
          url: `https://example.com/${i}`,
          method: 'GET',
          headers: {},
          stackTrace: '',
          timestamp: i,
        });
      }

      expect(testStore.size()).toBe(maxSize);
    });

    it('应该始终保持最新请求可访问', () => {
      const maxSize = 10;
      const testStore = createRequestStore(maxSize, 1024 * 1024);
      
      for (let i = 0; i < 20; i++) {
        testStore.add({
          id: `req_${i}`,
          url: `https://example.com/${i}`,
          method: 'GET',
          headers: {},
          stackTrace: '',
          timestamp: i,
        });
      }

      const lastId = 'req_19';
      const lastRequest = testStore.get(lastId);
      expect(lastRequest).toBeDefined();
      expect(lastRequest?.id).toBe(lastId);
    });

    it('缓冲区满时应覆盖最旧的条目', () => {
      const maxSize = 5;
      const testStore = createRequestStore(maxSize, 1024 * 1024);
      
      for (let i = 0; i < 10; i++) {
        testStore.add({
          id: `req_${i}`,
          url: `https://example.com/${i}`,
          method: 'GET',
          headers: {},
          stackTrace: '',
          timestamp: i,
        });
      }

      // 最旧的（0-4）应该被覆盖
      expect(testStore.get('req_0')).toBeUndefined();
      expect(testStore.get('req_4')).toBeUndefined();
      // 最新的（5-9）应该存在
      expect(testStore.get('req_5')).toBeDefined();
      expect(testStore.get('req_9')).toBeDefined();
    });
  });

  describe('Body 截断', () => {
    it('超过限制的 Body 应该被截断并设置标志', () => {
      const maxBodySize = 100;
      const testStore = createRequestStore(100, maxBodySize);
      const largeBody = 'x'.repeat(200);

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
      expect(request).toBeDefined();
      expect(Buffer.byteLength(request!.body || '')).toBeLessThanOrEqual(maxBodySize);
      expect(request!.bodyTruncated).toBe(true);
    });

    it('限制范围内的 Body 不应被截断', () => {
      const maxBodySize = 100;
      const testStore = createRequestStore(100, maxBodySize);
      const normalBody = 'x'.repeat(50);

      testStore.add({
        id: 'req_normal',
        url: 'https://example.com',
        method: 'POST',
        headers: {},
        body: normalBody,
        stackTrace: '',
        timestamp: 0,
      });

      const request = testStore.get('req_normal');
      expect(request?.body).toBe(normalBody);
      expect(request?.bodyTruncated).not.toBe(true);
    });

    it('响应 Body 也应该被截断', () => {
      const maxBodySize = 100;
      const testStore = createRequestStore(100, maxBodySize);
      const largeBody = 'y'.repeat(200);

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

  describe('查询功能', () => {
    it('应能通过 ID 查找请求', () => {
      store.add({ id: 'req_1', url: 'https://a.com', method: 'GET', headers: {}, stackTrace: '', timestamp: 0 });
      const found = store.get('req_1');
      expect(found?.id).toBe('req_1');
    });

    it('应能通过 TraceID 查找请求', () => {
      const traceId = 'trace_123';
      store.add({ id: 'req_1', traceId, url: 'https://a.com', method: 'GET', headers: {}, stackTrace: '', timestamp: 0 });
      store.add({ id: 'req_2', traceId, url: 'https://b.com', method: 'GET', headers: {}, stackTrace: '', timestamp: 1 });
      store.add({ id: 'req_3', traceId: 'other', url: 'https://c.com', method: 'GET', headers: {}, stackTrace: '', timestamp: 2 });

      const results = store.getByTraceId(traceId);
      expect(results.length).toBe(2);
      expect(results.every(r => r.traceId === traceId)).toBe(true);
    });

    it('应能通过 URL 模式查找请求', () => {
      store.add({ id: 'api_1', url: 'https://api.example.com/users', method: 'GET', headers: {}, stackTrace: '', timestamp: 0 });
      store.add({ id: 'cdn_1', url: 'https://cdn.example.com/image.png', method: 'GET', headers: {}, stackTrace: '', timestamp: 1 });

      const apiResults = store.query({ urlPattern: /api\.example\.com/ });
      expect(apiResults.length).toBe(1);
      expect(apiResults[0].id).toBe('api_1');

      const cdnResults = store.query({ urlPattern: 'cdn' });
      expect(cdnResults.length).toBe(1);
      expect(cdnResults[0].id).toBe('cdn_1');
    });

    it('应能通过状态码查找请求', () => {
      store.add({ id: 'req_1', url: 'https://a.com', method: 'GET', headers: {}, stackTrace: '', timestamp: 0 });
      store.add({ id: 'req_2', url: 'https://b.com', method: 'GET', headers: {}, stackTrace: '', timestamp: 1 });

      store.updateResponse('req_1', { statusCode: 200, statusMessage: 'OK', headers: {} });
      store.updateResponse('req_2', { statusCode: 404, statusMessage: 'Not Found', headers: {} });

      const okResults = store.query({ statusCode: 200 });
      expect(okResults.length).toBe(1);
      expect(okResults[0].id).toBe('req_1');

      const errorResults = store.query({ statusCodeMin: 400 });
      expect(errorResults.length).toBe(1);
      expect(errorResults[0].id).toBe('req_2');
    });

    it('组合查询应正常工作', () => {
      store.add({ id: 'req_1', traceId: 'trace_1', url: 'https://api.com/users', method: 'GET', headers: {}, stackTrace: '', timestamp: 0 });
      store.add({ id: 'req_2', traceId: 'trace_1', url: 'https://api.com/users', method: 'POST', headers: {}, stackTrace: '', timestamp: 1 });

      store.updateResponse('req_1', { statusCode: 200, statusMessage: 'OK', headers: {} });

      const results = store.query({ 
        traceId: 'trace_1', 
        method: 'GET',
        statusCode: 200 
      });
      
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('req_1');
    });
  });

  describe('getAll', () => {
    it('应该按时间倒序返回所有请求', () => {
      for (let i = 0; i < 5; i++) {
        store.add({
          id: `req_${i}`,
          url: `https://example.com/${i}`,
          method: 'GET',
          headers: {},
          stackTrace: '',
          timestamp: i,
        });
      }

      const all = store.getAll();
      expect(all.length).toBe(5);
      expect(all[0].id).toBe('req_4');
      expect(all[4].id).toBe('req_0');
    });
  });
});