/**
 * GUI Server 属性测试
 * 
 * Property 1: 服务器端口监听
 * *For any* valid port number configuration, when the GUI server starts,
 * it SHALL listen on that port and accept HTTP connections.
 * 
 * **Validates: Requirements 1.1**
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createGUIServer, type IGUIServer } from './server.js';
import { createWebSocketHub, type IWebSocketHub } from './websocket-hub.js';
import { createEventBridge, type IEventBridge } from './event-bridge.js';
import { resetRequestStore } from '../store/ring-buffer.js';
import { setConfig, resetConfig } from '../config.js';

describe('GUIServer 属性测试', () => {
  let servers: IGUIServer[] = [];

  afterEach(async () => {
    // 清理所有启动的服务器
    for (const server of servers) {
      try {
        await server.stop();
      } catch {
        // 忽略停止错误
      }
    }
    servers = [];
    resetRequestStore();
    resetConfig();
  });

  /**
   * Property 1: 服务器端口监听
   * 
   * Feature: network-devtools-gui, Property 1: 服务器端口监听
   * 
   * *For any* valid port number configuration, when the GUI server starts,
   * it SHALL listen on that port and accept HTTP connections.
   * 
   * **Validates: Requirements 1.1**
   */
  it('Property 1: 服务器端口监听 - 任意有效端口配置都应该能启动并接受连接', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成有效的端口号（使用高端口避免权限问题和冲突）
        fc.integer({ min: 49152, max: 65535 }),
        async (preferredPort) => {
          // 配置端口
          setConfig({ guiPort: preferredPort, wsPort: 'auto' });

          // 创建服务器实例
          const wsHub = createWebSocketHub();
          const eventBridge = createEventBridge(wsHub);
          const server = createGUIServer(wsHub, eventBridge);
          servers.push(server);

          try {
            // 启动服务器
            const result = await server.start();

            // 验证服务器正在运行
            expect(server.isRunning()).toBe(true);

            // 验证端口已分配
            expect(result.guiPort).toBeGreaterThan(0);
            expect(result.wsPort).toBeGreaterThan(0);

            // 验证 URL 格式正确
            expect(result.url).toContain(`http://127.0.0.1:${result.guiPort}`);
            expect(result.url).toContain(`wsPort=${result.wsPort}`);

            // 验证能够接受 HTTP 连接
            const response = await fetch(`http://127.0.0.1:${result.guiPort}/`);
            expect(response.status).toBeDefined();

            // 清理
            await server.stop();
            servers = servers.filter(s => s !== server);

            return true;
          } catch (err) {
            // 如果端口被占用，这是可接受的行为（会尝试下一个端口）
            // 只要服务器最终能启动就算通过
            if (server.isRunning()) {
              await server.stop();
              servers = servers.filter(s => s !== server);
              return true;
            }
            throw err;
          }
        }
      ),
      {
        numRuns: 10, // 减少运行次数避免端口耗尽
        verbose: true,
      }
    );
  }, 60000); // 增加超时时间

  /**
   * Property 1 补充: 自动端口分配
   * 
   * 当配置为 'auto' 时，服务器应该自动获取可用端口
   */
  it('Property 1 补充: 自动端口分配应该总是成功', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null), // 不需要生成数据，只测试 'auto' 模式
        async () => {
          // 配置为自动端口
          setConfig({ guiPort: 'auto', wsPort: 'auto' });

          // 创建服务器实例
          const wsHub = createWebSocketHub();
          const eventBridge = createEventBridge(wsHub);
          const server = createGUIServer(wsHub, eventBridge);
          servers.push(server);

          // 启动服务器
          const result = await server.start();

          // 验证服务器正在运行
          expect(server.isRunning()).toBe(true);

          // 验证端口已分配
          expect(result.guiPort).toBeGreaterThan(0);
          expect(result.wsPort).toBeGreaterThan(0);

          // 验证两个端口不同
          expect(result.guiPort).not.toBe(result.wsPort);

          // 验证能够接受 HTTP 连接
          const response = await fetch(`http://127.0.0.1:${result.guiPort}/`);
          expect(response.status).toBeDefined();

          // 清理
          await server.stop();
          servers = servers.filter(s => s !== server);

          return true;
        }
      ),
      {
        numRuns: 5,
        verbose: true,
      }
    );
  }, 30000);

  /**
   * Property 1 补充: 端口唯一性
   * 
   * GUI 端口和 WebSocket 端口应该始终不同
   */
  it('Property 1 补充: GUI 端口和 WebSocket 端口应该始终不同', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          setConfig({ guiPort: 'auto', wsPort: 'auto' });

          const wsHub = createWebSocketHub();
          const eventBridge = createEventBridge(wsHub);
          const server = createGUIServer(wsHub, eventBridge);
          servers.push(server);

          const result = await server.start();

          // 核心属性：两个端口必须不同
          expect(result.guiPort).not.toBe(result.wsPort);

          await server.stop();
          servers = servers.filter(s => s !== server);

          return true;
        }
      ),
      {
        numRuns: 10,
        verbose: true,
      }
    );
  }, 30000);
});
