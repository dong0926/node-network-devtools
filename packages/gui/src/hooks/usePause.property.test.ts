/**
 * 暂停功能属性测试
 * 
 * **Property 9: 暂停功能**
 * **Validates: Requirements 6.3**
 * 
 * 测试暂停功能的正确性：
 * - 暂停时，新的 request:start 消息不应该添加到请求列表
 * - 暂停时，request:complete 和 request:error 消息仍然应该更新已存在的请求
 * - 恢复后，新的请求应该正常添加
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { WSMessage } from './useWebSocket';
import type { UIRequest, RequestStatus } from './useRequests';

/**
 * 模拟带暂停功能的请求状态管理器
 * 提取自 App.tsx 中的暂停逻辑，用于属性测试
 */
class PausableRequestStateManager {
  private requestsMap: Map<string, UIRequest> = new Map();
  private paused: boolean = false;

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
   * 获取暂停状态
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * 暂停
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * 恢复
   */
  resume(): void {
    this.paused = false;
  }

  /**
   * 处理请求开始事件
   */
  private handleRequestStart(payload: {
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
  private handleRequestComplete(payload: {
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
  private handleRequestError(payload: {
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
  private handleInitialData(payload: Array<{
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
      let status: RequestStatus = 'pending';
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
   * 处理 WebSocket 消息（带暂停逻辑）
   * 
   * 暂停时的行为：
   * - request:start: 不处理（不添加新请求）
   * - request:complete: 仍然处理（更新已存在的请求）
   * - request:error: 仍然处理（更新已存在的请求）
   * - requests:initial: 仍然处理
   * - requests:clear: 仍然处理
   */
  handleMessage(message: WSMessage): void {
    // 暂停时不处理新请求开始消息
    if (this.paused && message.type === 'request:start') {
      return;
    }

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
  fc.integer({ min: 200, max: 299 }),
  fc.integer({ min: 300, max: 399 }),
  fc.integer({ min: 400, max: 499 }),
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
// Property 9: 暂停功能
// ============================================================================

describe('Property 9: 暂停功能', () => {
  /**
   * **Validates: Requirements 6.3**
   * 
   * *For any* new request event received while paused, 
   * the UI request list SHALL NOT be updated until resumed.
   */
  describe('暂停时不添加新请求', () => {
    it('暂停状态下，request:start 消息不应该添加新请求', () => {
      fc.assert(
        fc.property(
          fc.array(requestStartMessageArb, { minLength: 1, maxLength: 20 }),
          (messages) => {
            const manager = new PausableRequestStateManager();
            
            // 暂停
            manager.pause();
            expect(manager.isPaused()).toBe(true);
            
            // 处理所有消息
            for (const message of messages) {
              manager.handleMessage(message);
            }
            
            // 验证没有添加任何请求
            expect(manager.getRequests().length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('暂停前添加的请求应该保留，暂停后的新请求不应该添加', () => {
      fc.assert(
        fc.property(
          fc.array(requestStartMessageArb, { minLength: 1, maxLength: 10 }),
          fc.array(requestStartMessageArb, { minLength: 1, maxLength: 10 }),
          (beforePauseMessages, afterPauseMessages) => {
            const manager = new PausableRequestStateManager();
            
            // 暂停前添加请求
            const beforeIds = new Set<string>();
            for (const message of beforePauseMessages) {
              manager.handleMessage(message);
              beforeIds.add(message.payload.id);
            }
            const countBeforePause = manager.getRequests().length;
            expect(countBeforePause).toBe(beforeIds.size);
            
            // 暂停
            manager.pause();
            
            // 暂停后尝试添加新请求
            for (const message of afterPauseMessages) {
              manager.handleMessage(message);
            }
            
            // 验证请求数量没有增加（除非 ID 重复）
            const currentRequests = manager.getRequests();
            expect(currentRequests.length).toBe(beforeIds.size);
            
            // 验证所有请求都是暂停前添加的
            for (const request of currentRequests) {
              expect(beforeIds.has(request.id)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('暂停时仍然更新已存在的请求', () => {
    it('暂停状态下，request:complete 消息应该更新已存在的请求', () => {
      fc.assert(
        fc.property(
          requestStartMessageArb,
          statusCodeArb,
          (startMessage, statusCode) => {
            const manager = new PausableRequestStateManager();
            
            // 先添加请求
            manager.handleMessage(startMessage);
            expect(manager.getRequests().length).toBe(1);
            expect(manager.getRequestsMap().get(startMessage.payload.id)?.status).toBe('pending');
            
            // 暂停
            manager.pause();
            
            // 发送完成消息
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

    it('暂停状态下，request:error 消息应该更新已存在的请求', () => {
      fc.assert(
        fc.property(
          requestStartMessageArb,
          fc.constantFrom('ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'),
          (startMessage, errorCode) => {
            const manager = new PausableRequestStateManager();
            
            // 先添加请求
            manager.handleMessage(startMessage);
            expect(manager.getRequests().length).toBe(1);
            expect(manager.getRequestsMap().get(startMessage.payload.id)?.status).toBe('pending');
            
            // 暂停
            manager.pause();
            
            // 发送错误消息
            const errorMessage: WSMessage = {
              type: 'request:error',
              payload: {
                id: startMessage.payload.id,
                code: errorCode,
                message: '连接失败',
              },
              timestamp: Date.now(),
            };
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

  describe('暂停时仍然处理初始数据和清空', () => {
    it('暂停状态下，requests:initial 消息应该正常处理', () => {
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
            const manager = new PausableRequestStateManager();
            
            // 暂停
            manager.pause();
            
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

    it('暂停状态下，requests:clear 消息应该正常处理', () => {
      fc.assert(
        fc.property(
          fc.array(requestStartMessageArb, { minLength: 1, maxLength: 10 }),
          (messages) => {
            const manager = new PausableRequestStateManager();
            
            // 先添加一些请求
            for (const message of messages) {
              manager.handleMessage(message);
            }
            expect(manager.getRequests().length).toBeGreaterThan(0);
            
            // 暂停
            manager.pause();
            
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

  describe('恢复后正常添加请求', () => {
    it('恢复后，request:start 消息应该正常添加新请求', () => {
      fc.assert(
        fc.property(
          fc.array(requestStartMessageArb, { minLength: 1, maxLength: 10 }),
          fc.array(requestStartMessageArb, { minLength: 1, maxLength: 10 }),
          (pausedMessages, resumedMessages) => {
            const manager = new PausableRequestStateManager();
            
            // 暂停
            manager.pause();
            
            // 暂停时发送消息（不应该添加）
            for (const message of pausedMessages) {
              manager.handleMessage(message);
            }
            expect(manager.getRequests().length).toBe(0);
            
            // 恢复
            manager.resume();
            expect(manager.isPaused()).toBe(false);
            
            // 恢复后发送消息（应该添加）
            const resumedIds = new Set<string>();
            for (const message of resumedMessages) {
              manager.handleMessage(message);
              resumedIds.add(message.payload.id);
            }
            
            // 验证请求数量等于恢复后的唯一 ID 数量
            expect(manager.getRequests().length).toBe(resumedIds.size);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('暂停-恢复-暂停-恢复 循环应该正确工作', () => {
      fc.assert(
        fc.property(
          requestStartMessageArb,
          requestStartMessageArb,
          requestStartMessageArb,
          requestStartMessageArb,
          (msg1, msg2, msg3, msg4) => {
            const manager = new PausableRequestStateManager();
            
            // 第一阶段：正常添加
            manager.handleMessage(msg1);
            expect(manager.getRequests().length).toBe(1);
            
            // 第二阶段：暂停，不添加
            manager.pause();
            manager.handleMessage(msg2);
            // 如果 msg2.id 与 msg1.id 不同，则数量仍为 1
            const uniqueIds1 = new Set([msg1.payload.id]);
            expect(manager.getRequests().length).toBe(uniqueIds1.size);
            
            // 第三阶段：恢复，正常添加
            manager.resume();
            manager.handleMessage(msg3);
            const uniqueIds2 = new Set([msg1.payload.id, msg3.payload.id]);
            expect(manager.getRequests().length).toBe(uniqueIds2.size);
            
            // 第四阶段：再次暂停，不添加
            manager.pause();
            manager.handleMessage(msg4);
            // 数量应该与第三阶段相同
            expect(manager.getRequests().length).toBe(uniqueIds2.size);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('综合属性测试', () => {
    /**
     * 综合测试：随机的暂停/恢复序列和消息序列
     */
    it('任意暂停/恢复序列下，暂停时不添加新请求，恢复时正常添加', () => {
      // 定义操作类型
      type Operation = 
        | { type: 'pause' }
        | { type: 'resume' }
        | { type: 'message'; message: WSMessage };

      // 生成操作序列
      const operationArb: fc.Arbitrary<Operation> = fc.oneof(
        fc.constant({ type: 'pause' as const }),
        fc.constant({ type: 'resume' as const }),
        requestStartMessageArb.map(message => ({ type: 'message' as const, message }))
      );

      fc.assert(
        fc.property(
          fc.array(operationArb, { minLength: 1, maxLength: 50 }),
          (operations) => {
            const manager = new PausableRequestStateManager();
            const expectedIds = new Set<string>();
            let isPaused = false;

            for (const op of operations) {
              switch (op.type) {
                case 'pause':
                  manager.pause();
                  isPaused = true;
                  break;
                case 'resume':
                  manager.resume();
                  isPaused = false;
                  break;
                case 'message':
                  manager.handleMessage(op.message);
                  // 只有在非暂停状态下才添加到预期集合
                  if (!isPaused && op.message.type === 'request:start') {
                    expectedIds.add((op.message.payload as any).id);
                  }
                  break;
              }
            }

            // 验证实际请求数量等于预期
            expect(manager.getRequests().length).toBe(expectedIds.size);
            
            // 验证所有请求 ID 都在预期集合中
            for (const request of manager.getRequests()) {
              expect(expectedIds.has(request.id)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
