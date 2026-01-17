/**
 * WebSocket Hub 测试
 * 
 * **Property 2: WebSocket 客户端计数一致性**
 * **Property 3: WebSocket 事件广播完整性**
 * **Property 4: 初始数据完整性**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import WebSocket from 'ws';
import {
  createWebSocketHub,
  createRequestStartMessage,
  createRequestCompleteMessage,
  createRequestErrorMessage,
  createInitialDataMessage,
  type IWebSocketHub,
  type WSMessage,
} from './websocket-hub.js';
import type { RequestData, ResponseData, ErrorData } from '../store/ring-buffer.js';

describe('WebSocket Hub', () => {
  let hub: IWebSocketHub;
  let port: number;

  beforeEach(async () => {
    hub = createWebSocketHub();
    port = await hub.start(0); // 使用随机端口
  });

  afterEach(async () => {
    await hub.stop();
  });

  /**
   * 创建 WebSocket 客户端并等待连接
   */
  async function createClient(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}`);
      ws.on('open', () => {
        // 等待一小段时间确保连接完全建立
        setTimeout(() => resolve(ws), 10);
      });
      ws.on('error', reject);
    });
  }

  /**
   * 等待接收消息
   */
  async function waitForMessage(ws: WebSocket, timeout: number = 1000): Promise<WSMessage> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('超时')), timeout);
      ws.once('message', (data) => {
        clearTimeout(timer);
        resolve(JSON.parse(data.toString()));
      });
    });
  }

  describe('基础功能', () => {
    it('应该成功启动和停止', async () => {
      expect(hub.isRunning()).toBe(true);
      expect(hub.getPort()).toBe(port);
      
      await hub.stop();
      expect(hub.isRunning()).toBe(false);
      expect(hub.getPort()).toBe(null);
    });

    it('应该接受客户端连接', async () => {
      const client = await createClient();
      expect(hub.getClientCount()).toBe(1);
      client.close();
    });

    it('应该处理客户端断开', async () => {
      const client = await createClient();
      expect(hub.getClientCount()).toBe(1);
      
      client.close();
      // 等待断开事件处理
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(hub.getClientCount()).toBe(0);
    });
  });

  /**
   * Property 2: WebSocket 客户端计数一致性
   * 
   * *For any* sequence of client connections and disconnections, 
   * the WebSocket Hub's client count SHALL equal the number of currently connected clients.
   */
  describe('Property 2: WebSocket 客户端计数一致性', () => {
    it('连接后客户端数量应该增加', async () => {
      const clients: WebSocket[] = [];
      
      // 连接多个客户端
      for (let i = 0; i < 5; i++) {
        const client = await createClient();
        clients.push(client);
        expect(hub.getClientCount()).toBe(i + 1);
      }

      // 清理
      for (const client of clients) {
        client.close();
      }
    });

    it('断开后客户端数量应该减少', async () => {
      const clients: WebSocket[] = [];
      
      // 连接 5 个客户端
      for (let i = 0; i < 5; i++) {
        clients.push(await createClient());
      }
      expect(hub.getClientCount()).toBe(5);

      // 逐个断开
      for (let i = 4; i >= 0; i--) {
        clients[i].close();
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(hub.getClientCount()).toBe(i);
      }
    });

    it('属性测试：随机连接/断开序列', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
          async (actions) => {
            const clients: WebSocket[] = [];
            let expectedCount = 0;

            for (const shouldConnect of actions) {
              if (shouldConnect) {
                // 连接
                const client = await createClient();
                clients.push(client);
                expectedCount++;
              } else if (clients.length > 0) {
                // 断开最后一个
                const client = clients.pop()!;
                client.close();
                await new Promise(resolve => setTimeout(resolve, 50));
                expectedCount--;
              }
              
              expect(hub.getClientCount()).toBe(expectedCount);
            }

            // 清理
            for (const client of clients) {
              client.close();
            }
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 3: WebSocket 事件广播完整性
   * 
   * *For any* request event and any number of connected WebSocket clients, 
   * all connected clients SHALL receive the event message.
   */
  describe('Property 3: WebSocket 事件广播完整性', () => {
    it('所有客户端应该收到广播消息', async () => {
      const clients: WebSocket[] = [];
      const receivedMessages: WSMessage[][] = [];

      // 连接 3 个客户端
      for (let i = 0; i < 3; i++) {
        const client = await createClient();
        clients.push(client);
        receivedMessages.push([]);
        
        client.on('message', (data) => {
          receivedMessages[i].push(JSON.parse(data.toString()));
        });
      }

      // 广播消息
      const message: WSMessage = {
        type: 'request:start',
        payload: { id: 'test-1', url: 'http://example.com' },
        timestamp: Date.now(),
      };
      hub.broadcast(message);

      // 等待消息传递
      await new Promise(resolve => setTimeout(resolve, 100));

      // 验证所有客户端都收到了消息
      for (let i = 0; i < 3; i++) {
        expect(receivedMessages[i].length).toBe(1);
        expect(receivedMessages[i][0].type).toBe('request:start');
        expect((receivedMessages[i][0].payload as any).id).toBe('test-1');
      }

      // 清理
      for (const client of clients) {
        client.close();
      }
    });

    it('属性测试：随机客户端数量和消息', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          fc.array(
            fc.record({
              type: fc.constantFrom('request:start', 'request:complete', 'request:error') as fc.Arbitrary<'request:start' | 'request:complete' | 'request:error'>,
              id: fc.string({ minLength: 1, maxLength: 10 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (clientCount, messages) => {
            const clients: WebSocket[] = [];
            const receivedCounts: number[] = [];

            // 连接客户端
            for (let i = 0; i < clientCount; i++) {
              const client = await createClient();
              clients.push(client);
              receivedCounts.push(0);
              
              client.on('message', () => {
                receivedCounts[i]++;
              });
            }

            // 广播消息
            for (const msg of messages) {
              hub.broadcast({
                type: msg.type,
                payload: { id: msg.id },
                timestamp: Date.now(),
              });
            }

            // 等待消息传递
            await new Promise(resolve => setTimeout(resolve, 100));

            // 验证所有客户端收到相同数量的消息
            for (let i = 0; i < clientCount; i++) {
              expect(receivedCounts[i]).toBe(messages.length);
            }

            // 清理
            for (const client of clients) {
              client.close();
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 4: 初始数据完整性
   * 
   * *For any* set of requests in the Request_Store, 
   * when a new WebSocket client connects, it SHALL receive all existing requests as initial data.
   */
  describe('Property 4: 初始数据完整性', () => {
    it('新客户端应该收到初始数据', async () => {
      // 模拟已有请求数据
      const requests: RequestData[] = [
        {
          id: 'req-1',
          url: 'http://example.com/api/1',
          method: 'GET',
          headers: {},
          stackTrace: '',
          timestamp: Date.now(),
        },
        {
          id: 'req-2',
          url: 'http://example.com/api/2',
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{"test": true}',
          stackTrace: '',
          timestamp: Date.now(),
        },
      ];

      // 注册连接回调，发送初始数据
      hub.onClientConnect((clientId) => {
        // 延迟发送以确保客户端已准备好接收
        setTimeout(() => {
          hub.send(clientId, createInitialDataMessage(requests));
        }, 20);
      });

      // 连接客户端
      const client = await createClient();
      const message = await waitForMessage(client, 2000);

      // 验证初始数据
      expect(message.type).toBe('requests:initial');
      const payload = message.payload as any[];
      expect(payload.length).toBe(2);
      expect(payload[0].id).toBe('req-1');
      expect(payload[1].id).toBe('req-2');

      client.close();
    });

    it('属性测试：随机请求数据', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }),
              url: fc.webUrl(),
              method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
            }),
            { minLength: 0, maxLength: 10 }
          ),
          async (requestsData) => {
            // 为每次迭代创建新的 hub 实例，避免回调累积
            const testHub = createWebSocketHub();
            const testPort = await testHub.start(0);
            
            const requests: RequestData[] = requestsData.map(r => ({
              id: r.id,
              url: r.url,
              method: r.method,
              headers: {},
              stackTrace: '',
              timestamp: Date.now(),
            }));

            // 注册连接回调
            testHub.onClientConnect((clientId) => {
              setTimeout(() => {
                testHub.send(clientId, createInitialDataMessage(requests));
              }, 20);
            });
            
            // 连接客户端到测试 hub
            const client = await new Promise<WebSocket>((resolve, reject) => {
              const ws = new WebSocket(`ws://127.0.0.1:${testPort}`);
              ws.on('open', () => {
                setTimeout(() => resolve(ws), 10);
              });
              ws.on('error', reject);
            });
            
            if (requests.length > 0) {
              const message = await waitForMessage(client, 2000);
              expect(message.type).toBe('requests:initial');
              const payload = message.payload as any[];
              expect(payload.length).toBe(requests.length);
              
              // 验证所有请求 ID 都存在
              const receivedIds = new Set(payload.map((p: any) => p.id));
              for (const req of requests) {
                expect(receivedIds.has(req.id)).toBe(true);
              }
            }

            // 清理：关闭客户端和测试 hub
            client.close();
            await testHub.stop();
          }
        ),
        { numRuns: 10, timeout: 10000 }
      );
    }, 15000);
  });

  describe('消息创建函数', () => {
    it('createRequestStartMessage 应该正确创建消息', () => {
      const request: RequestData = {
        id: 'test-1',
        url: 'http://example.com',
        method: 'GET',
        headers: { 'accept': 'application/json' },
        stackTrace: 'at test.js:1:1',
        timestamp: 1234567890,
        traceId: 'trace-1',
      };

      const message = createRequestStartMessage(request);
      expect(message.type).toBe('request:start');
      expect((message.payload as any).id).toBe('test-1');
      expect((message.payload as any).url).toBe('http://example.com');
      expect((message.payload as any).method).toBe('GET');
    });

    it('createRequestCompleteMessage 应该正确创建消息', () => {
      const response: ResponseData = {
        statusCode: 200,
        statusMessage: 'OK',
        headers: { 'content-type': 'application/json' },
        body: '{"success": true}',
      };

      const message = createRequestCompleteMessage('test-1', response);
      expect(message.type).toBe('request:complete');
      expect((message.payload as any).id).toBe('test-1');
      expect((message.payload as any).statusCode).toBe(200);
    });

    it('createRequestErrorMessage 应该正确创建消息', () => {
      const error: ErrorData = {
        code: 'ECONNREFUSED',
        message: '连接被拒绝',
      };

      const message = createRequestErrorMessage('test-1', error);
      expect(message.type).toBe('request:error');
      expect((message.payload as any).id).toBe('test-1');
      expect((message.payload as any).code).toBe('ECONNREFUSED');
    });
  });
});
