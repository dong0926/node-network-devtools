/**
 * CDP 桥接模块
 * 
 * 将请求数据转换为 CDP Network 事件并发送到 Chrome DevTools
 * 
 * 注意：Network 事件广播功能需要：
 * 1. Node.js 20.18.0+ 版本
 * 2. --experimental-network-inspection 标志
 * 3. Chrome DevTools 目前还不支持显示这些事件（功能请求待实现）
 * 
 * 当前实现会将事件发送到控制台作为备选方案
 */

import * as inspector from 'node:inspector';
import { getConfig } from '../config.js';
import type { RequestData, ResponseData, ErrorData, TimingData } from '../store/ring-buffer.js';

// 检查 Network API 是否可用
const hasNetworkAPI = typeof (inspector as any).Network?.requestWillBeSent === 'function';

/**
 * CDP 堆栈帧
 */
export interface CDPCallFrame {
  functionName: string;
  scriptId: string;
  url: string;
  lineNumber: number;
  columnNumber: number;
}

/**
 * CDP 堆栈追踪
 */
export interface CDPStackTrace {
  callFrames: CDPCallFrame[];
}

/**
 * CDP 请求对象
 */
export interface CDPRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  hasPostData?: boolean;
}

/**
 * CDP 响应对象
 */
export interface CDPResponse {
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  mimeType: string;
  connectionReused: boolean;
  connectionId: number;
  encodedDataLength: number;
  securityState: string;
}

/**
 * CDP Bridge 接口
 */
export interface ICDPBridge {
  connect(): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;
  emitRequestWillBeSent(request: RequestData): void;
  emitResponseReceived(requestId: string, request: RequestData, response: ResponseData): void;
  emitLoadingFinished(requestId: string, timing?: TimingData): void;
  emitLoadingFailed(requestId: string, error: ErrorData): void;
}


/**
 * CDP Bridge 实现
 */
class CDPBridgeImpl implements ICDPBridge {
  private session: inspector.Session | null = null;
  private connected: boolean = false;

  /**
   * 连接到 Inspector
   */
  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      this.session = new inspector.Session();
      this.session.connect();
      
      // 启用 Network 域
      await this.post('Network.enable', {});
      this.connected = true;
    } catch (error) {
      this.session = null;
      this.connected = false;
      throw error;
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.session) {
      try {
        this.session.disconnect();
      } catch {
        // 忽略断开连接时的错误
      }
      this.session = null;
    }
    this.connected = false;
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * 发送 CDP 命令
   */
  private post(method: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.session) {
        reject(new Error('Session not connected'));
        return;
      }
      this.session.post(method, params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  /**
   * 脱敏请求头
   */
  private sanitizeHeaders(headers: Record<string, string | string[]>): Record<string, string> {
    const config = getConfig();
    const redactHeaders = config.redactHeaders.map(h => h.toLowerCase());
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      const strValue = Array.isArray(value) ? value.join(', ') : value;

      if (redactHeaders.includes(lowerKey)) {
        if (lowerKey === 'authorization') {
          // 保留 scheme，脱敏 credentials
          const parts = strValue.split(' ');
          sanitized[key] = parts.length > 1 ? `${parts[0]} [REDACTED]` : '[REDACTED]';
        } else {
          sanitized[key] = '[REDACTED]';
        }
      } else {
        sanitized[key] = strValue;
      }
    }

    return sanitized;
  }


  /**
   * 解析堆栈追踪为 CDP CallFrame 格式
   */
  private parseStackTrace(stackTrace: string): CDPStackTrace {
    const callFrames: CDPCallFrame[] = [];
    const lines = stackTrace.split('\n');

    for (const line of lines) {
      // 匹配格式: "    at functionName (file:line:column)"
      // 或: "    at file:line:column"
      const match = line.match(/^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/);
      if (match) {
        const [, functionName, url, lineNumber, columnNumber] = match;
        
        // 跳过 node_modules 和内部模块
        if (url.includes('node_modules') || url.startsWith('node:')) {
          continue;
        }

        callFrames.push({
          functionName: functionName || '(anonymous)',
          scriptId: '0', // V8 会分配实际的 scriptId
          url: url.startsWith('file://') ? url : `file://${url}`,
          lineNumber: parseInt(lineNumber, 10) - 1, // CDP 使用 0-based 行号
          columnNumber: parseInt(columnNumber, 10) - 1,
        });
      }
    }

    return { callFrames };
  }

  /**
   * 从 Content-Type 头提取 MIME 类型
   */
  private getMimeType(headers: Record<string, string | string[]>): string {
    const contentType = headers['content-type'] || headers['Content-Type'];
    if (!contentType) return 'text/plain';
    
    const value = Array.isArray(contentType) ? contentType[0] : contentType;
    // 提取 MIME 类型，去掉 charset 等参数
    return value.split(';')[0].trim();
  }

  /**
   * 发送 Network.requestWillBeSent 事件
   * 
   * 注意：需要 Node.js 20.18.0+ 和 --experimental-network-inspection 标志
   */
  emitRequestWillBeSent(request: RequestData): void {
    if (!this.connected) return;

    try {
      const cdpRequest: CDPRequest = {
        url: request.url,
        method: request.method,
        headers: this.sanitizeHeaders(request.headers),
      };

      // 处理请求体
      if (request.body) {
        cdpRequest.hasPostData = true;
        cdpRequest.postData = Buffer.isBuffer(request.body) 
          ? request.body.toString('utf-8') 
          : request.body;
      }

      const event = {
        requestId: request.id,
        loaderId: request.traceId || request.id,
        documentURL: request.url,
        request: cdpRequest,
        timestamp: request.timestamp / 1000,
        wallTime: request.timestamp / 1000,
        initiator: {
          type: 'script' as const,
          stack: this.parseStackTrace(request.stackTrace),
        },
        type: 'Fetch',
      };

      // 尝试使用 inspector.Network API 广播事件
      if (hasNetworkAPI) {
        (inspector as any).Network.requestWillBeSent(event);
      }
    } catch {
      // 忽略发送事件时的错误
    }
  }


  /**
   * 发送 Network.responseReceived 事件
   */
  emitResponseReceived(requestId: string, request: RequestData, response: ResponseData): void {
    if (!this.connected) return;

    try {
      const cdpResponse: CDPResponse = {
        url: request.url,
        status: response.statusCode,
        statusText: response.statusMessage,
        headers: this.sanitizeHeaders(response.headers),
        mimeType: this.getMimeType(response.headers),
        connectionReused: false,
        connectionId: 0,
        encodedDataLength: 0,
        securityState: request.url.startsWith('https') ? 'secure' : 'insecure',
      };

      const event = {
        requestId,
        loaderId: request.traceId || requestId,
        timestamp: Date.now() / 1000,
        type: 'Fetch',
        response: cdpResponse,
      };

      if (hasNetworkAPI) {
        (inspector as any).Network.responseReceived(event);
      }
    } catch {
      // 忽略发送事件时的错误
    }
  }

  /**
   * 发送 Network.loadingFinished 事件
   */
  emitLoadingFinished(requestId: string, _timing?: TimingData): void {
    if (!this.connected) return;

    try {
      const event = {
        requestId,
        timestamp: Date.now() / 1000,
        encodedDataLength: 0,
      };

      if (hasNetworkAPI) {
        (inspector as any).Network.loadingFinished(event);
      }
    } catch {
      // 忽略发送事件时的错误
    }
  }

  /**
   * 发送 Network.loadingFailed 事件
   */
  emitLoadingFailed(requestId: string, error: ErrorData): void {
    if (!this.connected) return;

    try {
      const event = {
        requestId,
        timestamp: Date.now() / 1000,
        type: 'Fetch',
        errorText: error.message,
        canceled: false,
        blockedReason: undefined,
      };

      if (hasNetworkAPI) {
        (inspector as any).Network.loadingFailed(event);
      }
    } catch {
      // 忽略发送事件时的错误
    }
  }
}

// 全局单例
let globalBridge: CDPBridgeImpl | null = null;

/**
 * 获取全局 CDP Bridge 实例
 */
export function getCDPBridge(): ICDPBridge {
  if (!globalBridge) {
    globalBridge = new CDPBridgeImpl();
  }
  return globalBridge;
}

/**
 * 重置全局 CDP Bridge（用于测试）
 */
export function resetCDPBridge(): void {
  if (globalBridge) {
    globalBridge.disconnect();
  }
  globalBridge = null;
}

/**
 * 创建新的 CDP Bridge 实例（用于测试）
 */
export function createCDPBridge(): ICDPBridge {
  return new CDPBridgeImpl();
}

/**
 * 检查 Inspector 是否已启用
 */
export function isInspectorEnabled(): boolean {
  try {
    return (inspector as any).url?.() !== undefined;
  } catch {
    return false;
  }
}

/**
 * 获取 Inspector URL
 */
export function getInspectorUrl(): string | undefined {
  try {
    return (inspector as any).url?.();
  } catch {
    return undefined;
  }
}
