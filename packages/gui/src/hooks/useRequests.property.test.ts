/**
 * 请求列表属性测试
 * 
 * **Property 5: 请求列表同步**
 * **Property 6: 状态码颜色编码**
 * **Validates: Requirements 3.2, 3.3, 3.4**
 * 
 * 测试请求列表的同步逻辑和状态码颜色编码逻辑
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { WSMessage } from './useWebSocket';
import type { UIRequest, RequestStatus } from './useRequests';
import { getStatusColorClass } from '../components/RequestRow';

/**
 * 请求状态类型
 */
type RequestStatusType = 'pending' | 'complete' | 'error';

/**
 * 模拟请求状态管理器
 * 提取自 useRequests hook 的核心逻辑，用于属性测试
 */
class RequestStateManager {
  private requestsMap: Map<string, UIRequest> = new Map();

  /**
   * 获取所有请求
   */
  getRequests(): UIRequest[] {
    return Array.from(this.requestsMap.values()).sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * 获取请求 Map
   */
  getRequestsMap(): Map<string, UIRequest> {
    return this.requestsMap;
  }


  /**
   * 处理请求开始事件
   */
  handleRequestStart(payload: {
    id: string;
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
    timestamp: number;
    traceId?: string;
  }): void {
    const request: UIRequest = {
      id: payload.id,
      url: payload.url,
      method: payload.method,
      status: 'pending',
      type: this.inferRequestType(payload.url),
      startTime: payload.timestamp,
      requestHeaders: payload.headers,
      requestBody: payload.body,
      traceId: payload.traceId,
    };
    this.requestsMap.set(payload.id, request);
  }

  /**
   * 处理请求完成事件
   */
  handleRequestComplete(payload: {
    id: string;
    statusCode: number;
    statusMessage: string;
    headers: Record<string, string>;
    body?: string;
  }): void {
    const existing = this.requestsMap.get(payload.id);
    if (!existing) return;

    const endTime = Date.now();
    const updated: UIRequest = {
      ...existing,
      status: 'complete',
      statusCode: payload.statusCode,
      statusText: payload.statusMessage,
      responseHeaders: payload.headers,
      responseBody: payload.body,
      endTime,
      time: endTime - existing.startTime,
    };
    this.requestsMap.set(payload.id, updated);
  }


  /**
   * 处理请求错误事件
   */
  handleRequestError(payload: {
    id: string;
    code: string;
    message: string;
  }): void {
    const existing = this.requestsMap.get(payload.id);
    if (!existing) return;

    const endTime = Date.now();
    const updated: UIRequest = {
      ...existing,
      status: 'error',
      error: { code: payload.code, message: payload.message },
      endTime,
      time: endTime - existing.startTime,
    };
    this.requestsMap.set(payload.id, updated);
  }

  /**
   * 处理初始数据
   */
  handleInitialData(payload: Array<{
    id: string;
    url: string;
    method: string;
    headers: Record<string, string>;
    timestamp: number;
    response?: {
      statusCode: number;
      statusMessage: string;
      headers: Record<string, string>;
      body?: string;
    };
    error?: { code: string; message: string };
  }>): void {
    this.requestsMap.clear();
    for (const item of payload) {
      let status: RequestStatusType = 'pending';
      if (item.response) status = 'complete';
      if (item.error) status = 'error';

      const request: UIRequest = {
        id: item.id,
        url: item.url,
        method: item.method,
        status,
        statusCode: item.response?.statusCode,
        statusText: item.response?.statusMessage,
        type: this.inferRequestType(item.url),
        startTime: item.timestamp,
        requestHeaders: item.headers,
        responseHeaders: item.response?.headers,
        responseBody: item.response?.body,
        error: item.error,
      };
      this.requestsMap.set(item.id, request);
    }
  }


  /**
   * 处理 WebSocket 消息
   */
  handleMessage(message: WSMessage): void {
    switch (message.type) {
      case 'request:start':
        this.handleRequestStart(message.payload as any);
        break;
      case 'request:complete':
        this.handleRequestComplete(message.payload as any);
        break;
      case 'request:error':
        this.handleRequestError(message.payload as any);
        break;
      case 'requests:initial':
        this.handleInitialData(message.payload as any);
        break;
      case 'requests:clear':
        this.requestsMap.clear();
        break;
    }
  }

  /**
   * 清空请求
   */
  clear(): void {
    this.requestsMap.clear();
  }

  /**
   * 从 URL 推断请求类型
   */
  private inferRequestType(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      if (pathname.endsWith('.json')) return 'json';
      if (pathname.endsWith('.js') || pathname.endsWith('.mjs')) return 'script';
      return 'fetch';
    } catch {
      return 'fetch';
    }
  }
}

// ============================================================================
// 生成器（Generators）
// ============================================================================

/**
 * 生成有效的请求 ID
 */
const requestIdArb = fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0);

/**
 * 生成有效的 URL
 */
const urlArb = fc.webUrl();


/**
 * 生成 HTTP 方法
 */
const methodArb = fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS');

/**
 * 生成 HTTP 状态码
 */
const statusCodeArb = fc.oneof(
  // 2xx 成功
  fc.integer({ min: 200, max: 299 }),
  // 3xx 重定向
  fc.integer({ min: 300, max: 399 }),
  // 4xx 客户端错误
  fc.integer({ min: 400, max: 499 }),
  // 5xx 服务器错误
  fc.integer({ min: 500, max: 599 })
);

/**
 * 生成请求开始消息
 */
const requestStartMessageArb = fc.record({
  type: fc.constant('request:start' as const),
  payload: fc.record({
    id: requestIdArb,
    url: urlArb,
    method: methodArb,
    headers: fc.constant({} as Record<string, string>),
    timestamp: fc.integer({ min: 1000000000000, max: 2000000000000 }),
  }),
  timestamp: fc.integer({ min: 1000000000000, max: 2000000000000 }),
});

// 注意：requestCompleteMessageArb 和 requestErrorMessageArb 函数已移除
// 因为在当前测试中不需要这些辅助函数


// ============================================================================
// Property 5: 请求列表同步
// ============================================================================

describe('Property 5: 请求列表同步', () => {
  /**
   * **Validates: Requirements 3.2**
   * 
   * *For any* request:start event received via WebSocket, 
   * the UI request list SHALL be updated to reflect the current state 
   * (new request added).
   */
  describe('新请求添加', () => {
    it('收到 request:start 消息后，请求应该被添加到列表中', () => {
      fc.assert(
        fc.property(
          requestStartMessageArb,
          (message) => {
            const manager = new RequestStateManager();
            
            // 处理消息
            manager.handleMessage(message);
            
            // 验证请求已添加
            const requests = manager.getRequests();
            expect(requests.length).toBe(1);
            expect(requests[0].id).toBe(message.payload.id);
            expect(requests[0].url).toBe(message.payload.url);
            expect(requests[0].method).toBe(message.payload.method);
            expect(requests[0].status).toBe('pending');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('多个 request:start 消息应该添加多个请求', () => {
      fc.assert(
        fc.property(
          fc.array(requestStartMessageArb, { minLength: 1, maxLength: 20 }),
          (messages) => {
            const manager = new RequestStateManager();
            const uniqueIds = new Set<string>();
            
            // 处理所有消息
            for (const message of messages) {
              manager.handleMessage(message);
              uniqueIds.add(message.payload.id);
            }
            
            // 验证请求数量等于唯一 ID 数量
            const requests = manager.getRequests();
            expect(requests.length).toBe(uniqueIds.size);
            
            // 验证所有唯一 ID 都存在
            const requestIds = new Set(requests.map(r => r.id));
            for (const id of uniqueIds) {
              expect(requestIds.has(id)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Validates: Requirements 3.3**
   * 
   * *For any* request:complete event received via WebSocket,
   * the UI request list SHALL update the corresponding row with response data.
   */
  describe('请求完成更新', () => {
    it('收到 request:complete 消息后，对应请求应该被更新', () => {
      fc.assert(
        fc.asyncProperty(
          requestStartMessageArb,
          statusCodeArb,
          async (startMessage, statusCode) => {
            const manager = new RequestStateManager();
            
            // 先添加请求
            manager.handleMessage(startMessage);
            
            // 生成完成消息
            const completeMessage: WSMessage = {
              type: 'request:complete',
              payload: {
                id: startMessage.payload.id,
                statusCode,
                statusMessage: 'OK',
                headers: {},
              },
              timestamp: Date.now(),
            };
            
            // 处理完成消息
            manager.handleMessage(completeMessage);
            
            // 验证请求已更新
            const request = manager.getRequestsMap().get(startMessage.payload.id);
            expect(request).toBeDefined();
            expect(request!.status).toBe('complete');
            expect(request!.statusCode).toBe(statusCode);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('对不存在的请求 ID 发送 complete 消息不应该创建新请求', () => {
      fc.assert(
        fc.property(
          requestIdArb,
          statusCodeArb,
          (id, statusCode) => {
            const manager = new RequestStateManager();
            
            // 直接发送完成消息（没有先发送开始消息）
            const completeMessage: WSMessage = {
              type: 'request:complete',
              payload: {
                id,
                statusCode,
                statusMessage: 'OK',
                headers: {},
              },
              timestamp: Date.now(),
            };
            
            manager.handleMessage(completeMessage);
            
            // 验证没有创建新请求
            expect(manager.getRequests().length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * 请求错误更新测试
   */
  describe('请求错误更新', () => {
    it('收到 request:error 消息后，对应请求应该被标记为错误', () => {
      fc.assert(
        fc.property(
          requestStartMessageArb,
          fc.constantFrom('ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'),
          (startMessage, errorCode) => {
            const manager = new RequestStateManager();
            
            // 先添加请求
            manager.handleMessage(startMessage);
            
            // 生成错误消息
            const errorMessage: WSMessage = {
              type: 'request:error',
              payload: {
                id: startMessage.payload.id,
                code: errorCode,
                message: '连接失败',
              },
              timestamp: Date.now(),
            };
            
            // 处理错误消息
            manager.handleMessage(errorMessage);
            
            // 验证请求已更新为错误状态
            const request = manager.getRequestsMap().get(startMessage.payload.id);
            expect(request).toBeDefined();
            expect(request!.status).toBe('error');
            expect(request!.error?.code).toBe(errorCode);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 初始数据加载测试
   */
  describe('初始数据加载', () => {
    it('收到 requests:initial 消息后，应该加载所有请求', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: requestIdArb,
              url: urlArb,
              method: methodArb,
              headers: fc.constant({} as Record<string, string>),
              timestamp: fc.integer({ min: 1000000000000, max: 2000000000000 }),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (initialRequests) => {
            const manager = new RequestStateManager();
            
            // 发送初始数据消息
            const initialMessage: WSMessage = {
              type: 'requests:initial',
              payload: initialRequests,
              timestamp: Date.now(),
            };
            
            manager.handleMessage(initialMessage);
            
            // 验证请求数量
            const uniqueIds = new Set(initialRequests.map(r => r.id));
            expect(manager.getRequests().length).toBe(uniqueIds.size);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * 清空请求测试
   */
  describe('清空请求', () => {
    it('收到 requests:clear 消息后，应该清空所有请求', () => {
      fc.assert(
        fc.property(
          fc.array(requestStartMessageArb, { minLength: 1, maxLength: 10 }),
          (messages) => {
            const manager = new RequestStateManager();
            
            // 添加一些请求
            for (const message of messages) {
              manager.handleMessage(message);
            }
            expect(manager.getRequests().length).toBeGreaterThan(0);
            
            // 发送清空消息
            const clearMessage: WSMessage = {
              type: 'requests:clear',
              payload: null,
              timestamp: Date.now(),
            };
            
            manager.handleMessage(clearMessage);
            
            // 验证请求已清空
            expect(manager.getRequests().length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============================================================================
// Property 6: 状态码颜色编码
// ============================================================================

describe('Property 6: 状态码颜色编码', () => {
  /**
   * **Validates: Requirements 3.4**
   * 
   * *For any* request with a status code, the UI SHALL apply the correct color class:
   * - green for 2xx
   * - yellow for 3xx  
   * - red for 4xx/5xx
   * - gray for pending
   */
  describe('状态码颜色映射', () => {
    it('2xx 状态码应该返回绿色类名', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 299 }),
          (statusCode) => {
            const colorClass = getStatusColorClass(statusCode, 'complete');
            expect(colorClass).toBe('text-devtools-success');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('3xx 状态码应该返回黄色类名', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 300, max: 399 }),
          (statusCode) => {
            const colorClass = getStatusColorClass(statusCode, 'complete');
            expect(colorClass).toBe('text-devtools-warning');
          }
        ),
        { numRuns: 100 }
      );
    });


    it('4xx 状态码应该返回红色类名', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 499 }),
          (statusCode) => {
            const colorClass = getStatusColorClass(statusCode, 'complete');
            expect(colorClass).toBe('text-devtools-error');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('5xx 状态码应该返回红色类名', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 500, max: 599 }),
          (statusCode) => {
            const colorClass = getStatusColorClass(statusCode, 'complete');
            expect(colorClass).toBe('text-devtools-error');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('pending 状态应该返回灰色类名', () => {
      fc.assert(
        fc.property(
          fc.option(fc.integer({ min: 100, max: 599 }), { nil: undefined }),
          (statusCode) => {
            const colorClass = getStatusColorClass(statusCode, 'pending');
            expect(colorClass).toBe('text-devtools-text-secondary');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('error 状态应该返回红色类名', () => {
      fc.assert(
        fc.property(
          fc.option(fc.integer({ min: 100, max: 599 }), { nil: undefined }),
          (statusCode) => {
            const colorClass = getStatusColorClass(statusCode, 'error');
            expect(colorClass).toBe('text-devtools-error');
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * 综合属性测试：任意状态码都应该映射到正确的颜色
   */
  describe('综合颜色映射', () => {
    it('任意有效状态码都应该映射到正确的颜色类名', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 599 }),
          fc.constantFrom('pending', 'complete', 'error') as fc.Arbitrary<RequestStatus>,
          (statusCode, status) => {
            const colorClass = getStatusColorClass(statusCode, status);
            
            // 验证返回的是有效的颜色类名
            const validClasses = [
              'text-devtools-success',
              'text-devtools-warning', 
              'text-devtools-error',
              'text-devtools-text-secondary',
            ];
            expect(validClasses).toContain(colorClass);
            
            // 验证颜色映射逻辑
            if (status === 'pending') {
              expect(colorClass).toBe('text-devtools-text-secondary');
            } else if (status === 'error') {
              expect(colorClass).toBe('text-devtools-error');
            } else if (statusCode >= 200 && statusCode < 300) {
              expect(colorClass).toBe('text-devtools-success');
            } else if (statusCode >= 300 && statusCode < 400) {
              expect(colorClass).toBe('text-devtools-warning');
            } else if (statusCode >= 400) {
              expect(colorClass).toBe('text-devtools-error');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('undefined 状态码在 complete 状态下应该返回灰色', () => {
      const colorClass = getStatusColorClass(undefined, 'complete');
      expect(colorClass).toBe('text-devtools-text-secondary');
    });
  });
});
