/**
 * Event Bridge 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createEventBridge,
  resetEventBridge,
  type IEventBridge,
} from './event-bridge.js';
import {
  createWebSocketHub,
  type IWebSocketHub,
  type WSMessage,
} from './websocket-hub.js';
import { resetRequestStore, getRequestStore } from '../store/ring-buffer.js';
import type { RequestData, ResponseData, ErrorData } from '../store/ring-buffer.js';

describe('EventBridge', () => {
  let bridge: IEventBridge;
  let wsHub: IWebSocketHub;
  let broadcastedMessages: WSMessage[];

  // 创建模拟的 WebSocket Hub
  function createMockWebSocketHub(): IWebSocketHub {
    const connectCallbacks: ((clientId: string) => void)[] = [];
    const messageCallbacks: ((clientId: string, message: WSMessage) => void)[] = [];
    
    return {
      start: vi.fn().mockResolvedValue(9999),
      stop: vi.fn().mockResolvedValue(undefined),
      broadcast: vi.fn((message: WSMessage) => {
        broadcastedMessages.push(message);
      }),
      send: vi.fn(),
      getClientCount: vi.fn().mockReturnValue(0),
      getClientIds: vi.fn().mockReturnValue([]),
      isRunning: vi.fn().mockReturnValue(true),
      getPort: vi.fn().mockReturnValue(9999),
      onClientConnect: vi.fn((callback) => {
        connectCallbacks.push(callback);
      }),
      onClientDisconnect: vi.fn(),
      onClientMessage: vi.fn((callback) => {
        messageCallbacks.push(callback);
      }),
      // 用于测试的辅助方法
      _triggerConnect: (clientId: string) => {
        for (const cb of connectCallbacks) cb(clientId);
      },
      _triggerMessage: (clientId: string, message: WSMessage) => {
        for (const cb of messageCallbacks) cb(clientId, message);
      },
    } as IWebSocketHub & {
      _triggerConnect: (clientId: string) => void;
      _triggerMessage: (clientId: string, message: WSMessage) => void;
    };
  }

  beforeEach(() => {
    broadcastedMessages = [];
    resetRequestStore();
    resetEventBridge();
    wsHub = createMockWebSocketHub();
    bridge = createEventBridge(wsHub);
  });

  afterEach(() => {
    bridge.stop();
    resetRequestStore();
    resetEventBridge();
  });

  describe('生命周期', () => {
    it('应该正确启动和停止', () => {
      expect(bridge.isRunning()).toBe(false);
      
      bridge.start();
      expect(bridge.isRunning()).toBe(true);
      
      bridge.stop();
      expect(bridge.isRunning()).toBe(false);
    });

    it('重复启动应该是安全的', () => {
      bridge.start();
      bridge.start();
      expect(bridge.isRunning()).toBe(true);
    });
  });

  describe('事件发送', () => {
    const mockRequest: RequestData = {
      id: 'req-1',
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      stackTrace: '',
      timestamp: Date.now(),
    };

    const mockResponse: ResponseData = {
      statusCode: 200,
      statusMessage: 'OK',
      headers: { 'content-type': 'application/json' },
      body: '{"success": true}',
    };

    const mockError: ErrorData = {
      code: 'ECONNREFUSED',
      message: 'Connection refused',
    };

    it('未启动时不应该发送事件', () => {
      bridge.emitRequestStart(mockRequest);
      expect(broadcastedMessages).toHaveLength(0);
    });

    it('应该广播请求开始事件', () => {
      bridge.start();
      bridge.emitRequestStart(mockRequest);
      
      expect(broadcastedMessages).toHaveLength(1);
      expect(broadcastedMessages[0].type).toBe('request:start');
      expect((broadcastedMessages[0].payload as { id: string }).id).toBe('req-1');
    });

    it('应该广播请求完成事件', () => {
      bridge.start();
      bridge.emitRequestComplete('req-1', mockResponse);
      
      expect(broadcastedMessages).toHaveLength(1);
      expect(broadcastedMessages[0].type).toBe('request:complete');
      expect((broadcastedMessages[0].payload as { id: string }).id).toBe('req-1');
      expect((broadcastedMessages[0].payload as { statusCode: number }).statusCode).toBe(200);
    });

    it('应该广播请求错误事件', () => {
      bridge.start();
      bridge.emitRequestError('req-1', mockError);
      
      expect(broadcastedMessages).toHaveLength(1);
      expect(broadcastedMessages[0].type).toBe('request:error');
      expect((broadcastedMessages[0].payload as { id: string }).id).toBe('req-1');
      expect((broadcastedMessages[0].payload as { code: string }).code).toBe('ECONNREFUSED');
    });
  });

  describe('暂停/恢复功能', () => {
    const mockRequest: RequestData = {
      id: 'req-1',
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: {},
      stackTrace: '',
      timestamp: Date.now(),
    };

    it('初始状态应该是未暂停', () => {
      expect(bridge.isPaused()).toBe(false);
    });

    it('应该能够暂停', () => {
      bridge.start();
      bridge.pause();
      
      expect(bridge.isPaused()).toBe(true);
      // 应该广播暂停消息
      expect(broadcastedMessages.some(m => m.type === 'control:pause')).toBe(true);
    });

    it('应该能够恢复', () => {
      bridge.start();
      bridge.pause();
      broadcastedMessages = [];
      
      bridge.resume();
      
      expect(bridge.isPaused()).toBe(false);
      // 应该广播恢复消息
      expect(broadcastedMessages.some(m => m.type === 'control:resume')).toBe(true);
    });

    it('暂停时应该缓存事件', () => {
      bridge.start();
      bridge.pause();
      broadcastedMessages = [];
      
      bridge.emitRequestStart(mockRequest);
      
      // 暂停时不应该广播请求事件
      expect(broadcastedMessages.filter(m => m.type === 'request:start')).toHaveLength(0);
    });

    it('恢复时应该发送缓存的事件', () => {
      bridge.start();
      bridge.pause();
      broadcastedMessages = [];
      
      bridge.emitRequestStart(mockRequest);
      bridge.resume();
      
      // 恢复后应该发送缓存的事件
      expect(broadcastedMessages.filter(m => m.type === 'request:start')).toHaveLength(1);
    });

    it('重复暂停应该是安全的', () => {
      bridge.start();
      bridge.pause();
      const pauseCount = broadcastedMessages.filter(m => m.type === 'control:pause').length;
      
      bridge.pause();
      
      // 不应该重复广播暂停消息
      expect(broadcastedMessages.filter(m => m.type === 'control:pause').length).toBe(pauseCount);
    });

    it('重复恢复应该是安全的', () => {
      bridge.start();
      bridge.resume(); // 未暂停时恢复
      
      // 不应该广播恢复消息
      expect(broadcastedMessages.filter(m => m.type === 'control:resume')).toHaveLength(0);
    });
  });

  describe('清空功能', () => {
    it('应该清空请求存储', () => {
      const store = getRequestStore();
      store.add({
        id: 'req-1',
        url: 'https://api.example.com',
        method: 'GET',
        headers: {},
        stackTrace: '',
        timestamp: Date.now(),
      });
      
      expect(store.size()).toBe(1);
      
      bridge.start();
      bridge.clear();
      
      expect(store.size()).toBe(0);
    });

    it('应该广播清空消息', () => {
      bridge.start();
      bridge.clear();
      
      expect(broadcastedMessages.some(m => m.type === 'requests:clear')).toBe(true);
    });

    it('应该清空缓存的事件', () => {
      bridge.start();
      bridge.pause();
      
      bridge.emitRequestStart({
        id: 'req-1',
        url: 'https://api.example.com',
        method: 'GET',
        headers: {},
        stackTrace: '',
        timestamp: Date.now(),
      });
      
      bridge.clear();
      broadcastedMessages = [];
      
      bridge.resume();
      
      // 恢复后不应该有缓存的请求事件
      expect(broadcastedMessages.filter(m => m.type === 'request:start')).toHaveLength(0);
    });
  });

  describe('客户端连接处理', () => {
    it('新客户端连接时应该发送初始数据', () => {
      const store = getRequestStore();
      store.add({
        id: 'req-1',
        url: 'https://api.example.com',
        method: 'GET',
        headers: {},
        stackTrace: '',
        timestamp: Date.now(),
      });
      
      bridge.start();
      
      // 模拟客户端连接
      const mockHub = wsHub as IWebSocketHub & { _triggerConnect: (clientId: string) => void };
      mockHub._triggerConnect('client-1');
      
      // 应该调用 send 发送初始数据
      expect(wsHub.send).toHaveBeenCalledWith(
        'client-1',
        expect.objectContaining({ type: 'requests:initial' })
      );
    });
  });

  describe('客户端消息处理', () => {
    it('应该处理暂停命令', () => {
      bridge.start();
      
      const mockHub = wsHub as IWebSocketHub & { _triggerMessage: (clientId: string, message: WSMessage) => void };
      mockHub._triggerMessage('client-1', {
        type: 'control:pause',
        payload: null,
        timestamp: Date.now(),
      });
      
      expect(bridge.isPaused()).toBe(true);
    });

    it('应该处理恢复命令', () => {
      bridge.start();
      bridge.pause();
      
      const mockHub = wsHub as IWebSocketHub & { _triggerMessage: (clientId: string, message: WSMessage) => void };
      mockHub._triggerMessage('client-1', {
        type: 'control:resume',
        payload: null,
        timestamp: Date.now(),
      });
      
      expect(bridge.isPaused()).toBe(false);
    });

    it('应该处理清空命令', () => {
      const store = getRequestStore();
      store.add({
        id: 'req-1',
        url: 'https://api.example.com',
        method: 'GET',
        headers: {},
        stackTrace: '',
        timestamp: Date.now(),
      });
      
      bridge.start();
      
      const mockHub = wsHub as IWebSocketHub & { _triggerMessage: (clientId: string, message: WSMessage) => void };
      mockHub._triggerMessage('client-1', {
        type: 'requests:clear',
        payload: null,
        timestamp: Date.now(),
      });
      
      expect(store.size()).toBe(0);
    });
  });
});
