/**
 * GUI Server 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGUIServer, resetGUIServer, type IGUIServer } from './server.js';
import { createWebSocketHub, type IWebSocketHub } from './websocket-hub.js';
import { createEventBridge, type IEventBridge } from './event-bridge.js';
import { resetRequestStore } from '../store/ring-buffer.js';

describe('GUIServer', () => {
  let server: IGUIServer;
  let wsHub: IWebSocketHub;
  let eventBridge: IEventBridge;

  beforeEach(() => {
    resetRequestStore();
    wsHub = createWebSocketHub();
    eventBridge = createEventBridge(wsHub);
    server = createGUIServer(wsHub, eventBridge);
  });

  afterEach(async () => {
    await server.stop();
    await resetGUIServer();
    resetRequestStore();
  });

  describe('生命周期', () => {
    it('初始状态应该是未运行', () => {
      expect(server.isRunning()).toBe(false);
      expect(server.getGuiPort()).toBeNull();
      expect(server.getWsPort()).toBeNull();
      expect(server.getUrl()).toBeNull();
    });

    it('应该能够启动服务器', async () => {
      const result = await server.start();
      
      expect(server.isRunning()).toBe(true);
      expect(result.guiPort).toBeGreaterThan(0);
      expect(result.wsPort).toBeGreaterThan(0);
      expect(result.url).toContain(`http://127.0.0.1:${result.guiPort}`);
      expect(result.url).toContain(`wsPort=${result.wsPort}`);
    });

    it('应该能够停止服务器', async () => {
      await server.start();
      await server.stop();
      
      expect(server.isRunning()).toBe(false);
      expect(server.getGuiPort()).toBeNull();
      expect(server.getWsPort()).toBeNull();
    });

    it('重复启动应该抛出错误', async () => {
      await server.start();
      
      await expect(server.start()).rejects.toThrow('GUI Server 已经在运行');
    });

    it('重复停止应该是安全的', async () => {
      await server.start();
      await server.stop();
      await server.stop(); // 不应该抛出错误
      
      expect(server.isRunning()).toBe(false);
    });
  });

  describe('端口分配', () => {
    it('应该分配不同的 GUI 和 WebSocket 端口', async () => {
      const result = await server.start();
      
      expect(result.guiPort).not.toBe(result.wsPort);
    });

    it('getGuiPort 应该返回正确的端口', async () => {
      const result = await server.start();
      
      expect(server.getGuiPort()).toBe(result.guiPort);
    });

    it('getWsPort 应该返回正确的端口', async () => {
      const result = await server.start();
      
      expect(server.getWsPort()).toBe(result.wsPort);
    });
  });

  describe('URL 生成', () => {
    it('应该生成正确格式的 URL', async () => {
      const result = await server.start();
      const url = server.getUrl();
      
      expect(url).toBe(`http://127.0.0.1:${result.guiPort}?wsPort=${result.wsPort}`);
    });

    it('未启动时 getUrl 应该返回 null', () => {
      expect(server.getUrl()).toBeNull();
    });
  });

  describe('HTTP 服务', () => {
    it('应该能够响应 HTTP 请求', async () => {
      const result = await server.start();
      
      // 发送 HTTP 请求
      const response = await fetch(`http://127.0.0.1:${result.guiPort}/`);
      
      // 即使没有静态文件，也应该返回响应（可能是 404）
      expect(response.status).toBeDefined();
    });
  });
});
