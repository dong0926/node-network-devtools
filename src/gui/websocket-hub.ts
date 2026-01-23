/**
 * WebSocket Hub 模块
 * 
 * 管理 WebSocket 客户端连接，广播消息到所有连接的客户端
 */

import { WebSocketServer, WebSocket } from 'ws';
import { nanoid } from 'nanoid';
import type { RequestData, ResponseData, ErrorData } from '../store/ring-buffer.js';

/**
 * WebSocket 消息类型
 */
export type WSMessageType = 
  | 'request:start'      // 请求开始
  | 'request:complete'   // 请求完成
  | 'request:error'      // 请求错误
  | 'server:trace'       // 服务端全链路追踪
  | 'requests:initial'   // 初始数据
  | 'requests:clear'     // 清空请求
  | 'control:pause'      // 暂停
  | 'control:resume';    // 恢复

/**
 * WebSocket 消息
 */
export interface WSMessage {
  type: WSMessageType;
  payload: unknown;
  timestamp: number;
}

/**
 * 客户端信息
 */
interface ClientInfo {
  id: string;
  ws: WebSocket;
  connectedAt: number;
}

/**
 * WebSocket Hub 接口
 */
export interface IWebSocketHub {
  start(port: number, host?: string): Promise<number>;
  stop(): Promise<void>;
  broadcast(message: WSMessage): void;
  send(clientId: string, message: WSMessage): void;
  getClientCount(): number;
  getClientIds(): string[];
  isRunning(): boolean;
  getPort(): number | null;
  
  // 事件回调
  onClientConnect(callback: (clientId: string) => void): void;
  onClientDisconnect(callback: (clientId: string) => void): void;
  onClientMessage(callback: (clientId: string, message: WSMessage) => void): void;
}

/**
 * WebSocket Hub 实现
 */
class WebSocketHubImpl implements IWebSocketHub {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientInfo> = new Map();
  private port: number | null = null;
  
  // 事件回调
  private connectCallbacks: ((clientId: string) => void)[] = [];
  private disconnectCallbacks: ((clientId: string) => void)[] = [];
  private messageCallbacks: ((clientId: string, message: WSMessage) => void)[] = [];

  /**
   * 启动 WebSocket 服务器
   */
  async start(port: number, host: string = '127.0.0.1'): Promise<number> {
    if (this.wss) {
      throw new Error('WebSocket Hub 已经在运行');
    }

    return new Promise((resolve, reject) => {
      this.wss = new WebSocketServer({ port, host });

      this.wss.on('listening', () => {
        const address = this.wss?.address();
        if (address && typeof address === 'object') {
          this.port = address.port;
          resolve(this.port);
        } else {
          reject(new Error('无法获取 WebSocket 端口'));
        }
      });

      this.wss.on('error', (err) => {
        reject(err);
      });

      this.wss.on('connection', (ws) => {
        this.handleConnection(ws);
      });
    });
  }

  /**
   * 处理新连接
   */
  private handleConnection(ws: WebSocket): void {
    const clientId = nanoid();
    const clientInfo: ClientInfo = {
      id: clientId,
      ws,
      connectedAt: Date.now(),
    };

    this.clients.set(clientId, clientInfo);

    // 触发连接回调
    for (const callback of this.connectCallbacks) {
      try {
        callback(clientId);
      } catch {
        // 忽略回调错误
      }
    }

    // 处理消息
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as WSMessage;
        for (const callback of this.messageCallbacks) {
          try {
            callback(clientId, message);
          } catch {
            // 忽略回调错误
          }
        }
      } catch {
        // 忽略解析错误
      }
    });

    // 处理断开连接
    ws.on('close', () => {
      this.clients.delete(clientId);
      for (const callback of this.disconnectCallbacks) {
        try {
          callback(clientId);
        } catch {
          // 忽略回调错误
        }
      }
    });

    // 处理错误
    ws.on('error', () => {
      // 错误时也移除客户端
      if (this.clients.has(clientId)) {
        this.clients.delete(clientId);
        for (const callback of this.disconnectCallbacks) {
          try {
            callback(clientId);
          } catch {
            // 忽略回调错误
          }
        }
      }
    });
  }

  /**
   * 停止 WebSocket 服务器
   */
  async stop(): Promise<void> {
    if (!this.wss) return;

    return new Promise((resolve) => {
      // 关闭所有客户端连接
      for (const client of this.clients.values()) {
        try {
          client.ws.close();
        } catch {
          // 忽略关闭错误
        }
      }
      this.clients.clear();

      // 关闭服务器
      this.wss?.close(() => {
        this.wss = null;
        this.port = null;
        resolve();
      });
    });
  }

  /**
   * 广播消息到所有客户端
   */
  broadcast(message: WSMessage): void {
    const data = JSON.stringify(message);
    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(data);
        } catch {
          // 忽略发送错误
        }
      }
    }
  }

  /**
   * 发送消息到指定客户端
   */
  send(clientId: string, message: WSMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (client.ws.readyState === WebSocket.OPEN) {
      const data = JSON.stringify(message);
      try {
        client.ws.send(data);
      } catch {
        // 忽略发送错误
      }
    }
  }

  /**
   * 获取连接的客户端数量
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * 获取所有客户端 ID
   */
  getClientIds(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * 检查是否正在运行
   */
  isRunning(): boolean {
    return this.wss !== null;
  }

  /**
   * 获取端口号
   */
  getPort(): number | null {
    return this.port;
  }

  /**
   * 注册客户端连接回调
   */
  onClientConnect(callback: (clientId: string) => void): void {
    this.connectCallbacks.push(callback);
  }

  /**
   * 注册客户端断开回调
   */
  onClientDisconnect(callback: (clientId: string) => void): void {
    this.disconnectCallbacks.push(callback);
  }

  /**
   * 注册客户端消息回调
   */
  onClientMessage(callback: (clientId: string, message: WSMessage) => void): void {
    this.messageCallbacks.push(callback);
  }
}

// 全局单例
let globalHub: WebSocketHubImpl | null = null;

/**
 * 获取全局 WebSocket Hub 实例
 */
export function getWebSocketHub(): IWebSocketHub {
  if (!globalHub) {
    globalHub = new WebSocketHubImpl();
  }
  return globalHub;
}

/**
 * 重置全局 WebSocket Hub（用于测试）
 */
export async function resetWebSocketHub(): Promise<void> {
  if (globalHub) {
    await globalHub.stop();
  }
  globalHub = null;
}

/**
 * 创建新的 WebSocket Hub 实例（用于测试）
 */
export function createWebSocketHub(): IWebSocketHub {
  return new WebSocketHubImpl();
}

/**
 * 创建请求开始消息
 */
export function createRequestStartMessage(request: RequestData): WSMessage {
  return {
    type: 'request:start',
    payload: {
      id: request.id,
      url: request.url,
      method: request.method,
      headers: request.headers,
      body: request.body ? (Buffer.isBuffer(request.body) ? request.body.toString('utf-8') : request.body) : undefined,
      timestamp: request.timestamp,
      traceId: request.traceId,
      stackTrace: request.stackTrace,
    },
    timestamp: Date.now(),
  };
}

/**
 * 创建请求完成消息
 */
export function createRequestCompleteMessage(requestId: string, response: ResponseData): WSMessage {
  return {
    type: 'request:complete',
    payload: {
      id: requestId,
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
      headers: response.headers,
      body: response.body ? (Buffer.isBuffer(response.body) ? response.body.toString('utf-8') : response.body) : undefined,
      bodyTruncated: response.bodyTruncated,
    },
    timestamp: Date.now(),
  };
}

/**
 * 创建请求错误消息
 */
export function createRequestErrorMessage(requestId: string, error: ErrorData): WSMessage {
  return {
    type: 'request:error',
    payload: {
      id: requestId,
      code: error.code,
      message: error.message,
    },
    timestamp: Date.now(),
  };
}

/**
 * 创建初始数据消息
 */
export function createInitialDataMessage(requests: RequestData[]): WSMessage {
  return {
    type: 'requests:initial',
    payload: requests.map(req => ({
      id: req.id,
      url: req.url,
      method: req.method,
      headers: req.headers,
      body: req.body ? (Buffer.isBuffer(req.body) ? req.body.toString('utf-8') : req.body) : undefined,
      timestamp: req.timestamp,
      traceId: req.traceId,
      stackTrace: req.stackTrace,
      response: req.response ? {
        statusCode: req.response.statusCode,
        statusMessage: req.response.statusMessage,
        headers: req.response.headers,
        body: req.response.body ? (Buffer.isBuffer(req.response.body) ? req.response.body.toString('utf-8') : req.response.body) : undefined,
        bodyTruncated: req.response.bodyTruncated,
      } : undefined,
      error: req.error,
      timing: req.timing,
    })),
    timestamp: Date.now(),
  };
}

/**
 * 创建服务端全链路追踪消息
 */
export function createServerTraceMessage(traceData: any): WSMessage {
  return {
    type: 'server:trace',
    payload: traceData,
    timestamp: Date.now(),
  };
}

/**
 * 创建清空请求消息
 */
export function createClearMessage(): WSMessage {
  return {
    type: 'requests:clear',
    payload: null,
    timestamp: Date.now(),
  };
}
