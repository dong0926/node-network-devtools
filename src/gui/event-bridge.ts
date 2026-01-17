/**
 * Event Bridge 模块
 * 
 * 连接请求拦截器和 WebSocket Hub，实现事件转发
 * 支持暂停/恢复和清空功能
 */

import type { RequestData, ResponseData, ErrorData } from '../store/ring-buffer.js';
import { getRequestStore } from '../store/ring-buffer.js';
import {
  getWebSocketHub,
  createRequestStartMessage,
  createRequestCompleteMessage,
  createRequestErrorMessage,
  createInitialDataMessage,
  createClearMessage,
  type IWebSocketHub,
  type WSMessage,
} from './websocket-hub.js';

/**
 * Event Bridge 接口
 */
export interface IEventBridge {
  // 从拦截器接收事件
  emitRequestStart(request: RequestData): void;
  emitRequestComplete(requestId: string, response: ResponseData): void;
  emitRequestError(requestId: string, error: ErrorData): void;
  
  // 控制方法
  pause(): void;
  resume(): void;
  isPaused(): boolean;
  clear(): void;
  
  // 生命周期
  start(): void;
  stop(): void;
  isRunning(): boolean;
}

/**
 * Event Bridge 实现
 */
class EventBridgeImpl implements IEventBridge {
  private paused: boolean = false;
  private running: boolean = false;
  private wsHub: IWebSocketHub;
  private pendingEvents: WSMessage[] = [];

  constructor(wsHub?: IWebSocketHub) {
    this.wsHub = wsHub ?? getWebSocketHub();
  }

  /**
   * 启动 Event Bridge
   * 注册 WebSocket 客户端连接回调，发送初始数据
   */
  start(): void {
    if (this.running) return;
    
    this.running = true;
    
    // 当新客户端连接时，发送初始数据
    this.wsHub.onClientConnect((clientId) => {
      const store = getRequestStore();
      const requests = store.getAll();
      const message = createInitialDataMessage(requests);
      this.wsHub.send(clientId, message);
    });

    // 处理客户端消息（控制命令）
    this.wsHub.onClientMessage((_clientId, message) => {
      this.handleClientMessage(message);
    });
  }

  /**
   * 停止 Event Bridge
   */
  stop(): void {
    this.running = false;
    this.pendingEvents = [];
  }

  /**
   * 检查是否正在运行
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * 处理客户端消息
   */
  private handleClientMessage(message: WSMessage): void {
    switch (message.type) {
      case 'control:pause':
        this.pause();
        break;
      case 'control:resume':
        this.resume();
        break;
      case 'requests:clear':
        this.clear();
        break;
    }
  }

  /**
   * 发送请求开始事件
   */
  emitRequestStart(request: RequestData): void {
    if (!this.running) return;
    
    const message = createRequestStartMessage(request);
    
    if (this.paused) {
      // 暂停时缓存事件
      this.pendingEvents.push(message);
    } else {
      this.wsHub.broadcast(message);
    }
  }

  /**
   * 发送请求完成事件
   */
  emitRequestComplete(requestId: string, response: ResponseData): void {
    if (!this.running) return;
    
    const message = createRequestCompleteMessage(requestId, response);
    
    if (this.paused) {
      // 暂停时缓存事件
      this.pendingEvents.push(message);
    } else {
      this.wsHub.broadcast(message);
    }
  }

  /**
   * 发送请求错误事件
   */
  emitRequestError(requestId: string, error: ErrorData): void {
    if (!this.running) return;
    
    const message = createRequestErrorMessage(requestId, error);
    
    if (this.paused) {
      // 暂停时缓存事件
      this.pendingEvents.push(message);
    } else {
      this.wsHub.broadcast(message);
    }
  }

  /**
   * 暂停事件广播
   */
  pause(): void {
    if (this.paused) return;
    
    this.paused = true;
    
    // 广播暂停状态
    this.wsHub.broadcast({
      type: 'control:pause',
      payload: null,
      timestamp: Date.now(),
    });
  }

  /**
   * 恢复事件广播
   */
  resume(): void {
    if (!this.paused) return;
    
    this.paused = false;
    
    // 广播恢复状态
    this.wsHub.broadcast({
      type: 'control:resume',
      payload: null,
      timestamp: Date.now(),
    });
    
    // 发送暂停期间缓存的事件
    for (const event of this.pendingEvents) {
      this.wsHub.broadcast(event);
    }
    this.pendingEvents = [];
  }

  /**
   * 检查是否暂停
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * 清空请求
   */
  clear(): void {
    // 清空存储
    const store = getRequestStore();
    store.clear();
    
    // 清空缓存的事件
    this.pendingEvents = [];
    
    // 广播清空消息
    this.wsHub.broadcast(createClearMessage());
  }
}

// 全局单例
let globalBridge: EventBridgeImpl | null = null;

/**
 * 获取全局 Event Bridge 实例
 */
export function getEventBridge(): IEventBridge {
  if (!globalBridge) {
    globalBridge = new EventBridgeImpl();
  }
  return globalBridge;
}

/**
 * 重置全局 Event Bridge（用于测试）
 */
export function resetEventBridge(): void {
  if (globalBridge) {
    globalBridge.stop();
  }
  globalBridge = null;
}

/**
 * 创建新的 Event Bridge 实例（用于测试）
 */
export function createEventBridge(wsHub?: IWebSocketHub): IEventBridge {
  return new EventBridgeImpl(wsHub);
}
