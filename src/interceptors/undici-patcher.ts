/**
 * Undici/Fetch 拦截器
 * 
 * 拦截 Node.js 原生 fetch API（基于 undici）
 * 使用 Agent.compose() 方法添加拦截器
 */

import { createRequire } from 'node:module';
import { nanoid } from 'nanoid';
import { getRequestStore, type RequestData, type ResponseData } from '../store/ring-buffer.js';
import { getConfig } from '../config.js';
import { getCurrentTraceId } from '../context/context-manager.js';
import { getEventBridge } from '../gui/event-bridge.js';

// 使用 createRequire 获取 undici 模块
const require = createRequire(import.meta.url);

// undici 类型定义
interface UndiciDispatcher {
  dispatch(options: any, handler: any): boolean;
  compose(interceptor: any): UndiciDispatcher;
}

interface UndiciModule {
  Agent: new (options?: any) => UndiciDispatcher;
  getGlobalDispatcher: () => UndiciDispatcher;
  setGlobalDispatcher: (dispatcher: UndiciDispatcher) => void;
}

let undici: UndiciModule | null = null;
let installed = false;
let originalDispatcher: UndiciDispatcher | null = null;

// 用于获取当前 TraceID 的回调
let getTraceIdCallback: (() => string | undefined) | null = null;

/**
 * 设置获取 TraceID 的回调
 */
export function setTraceIdGetter(getter: () => string | undefined): void {
  getTraceIdCallback = getter;
}

/**
 * 生成请求 ID
 */
function generateRequestId(): string {
  return `req_${nanoid(12)}`;
}

/**
 * 捕获堆栈追踪
 */
function captureStackTrace(): string {
  const err = new Error();
  const stack = err.stack || '';
  
  const lines = stack.split('\n');
  const filteredLines = lines.filter(line => {
    if (line.trim().startsWith('Error')) return false;
    if (line.includes('undici-patcher')) return false;
    if (line.includes('node:internal')) return false;
    return true;
  });

  return filteredLines.join('\n');
}

/**
 * 将 headers 转换为 Record 格式
 */
function headersToRecord(headers: any): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  if (!headers) return result;
  
  // 处理数组格式 [key1, value1, key2, value2, ...] 或 [Buffer, Buffer, ...]
  // undici 的响应头是这种格式，元素可能是 Buffer
  // 注意：必须先检查数组，因为数组也有 entries 方法
  if (Array.isArray(headers)) {
    for (let i = 0; i < headers.length; i += 2) {
      const key = headers[i];
      const value = headers[i + 1];
      if (key !== undefined && value !== undefined) {
        const keyStr = Buffer.isBuffer(key) ? key.toString('utf8') : String(key);
        const valueStr = Buffer.isBuffer(value) ? value.toString('utf8') : String(value);
        result[keyStr.toLowerCase()] = valueStr;
      }
    }
    return result;
  }
  
  // 处理 Headers 对象（有 entries 方法，但不是数组）
  if (typeof headers.entries === 'function') {
    for (const [key, value] of headers.entries()) {
      result[String(key).toLowerCase()] = String(value);
    }
    return result;
  }
  
  // 处理普通对象
  if (typeof headers === 'object') {
    for (const key of Object.keys(headers)) {
      const value = headers[key];
      if (value !== undefined) {
        result[String(key).toLowerCase()] = String(value);
      }
    }
  }
  
  return result;
}

/**
 * 创建拦截器函数
 */
function createInterceptor() {
  return (dispatch: (opts: any, handler: any) => boolean) => {
    return function interceptedDispatch(opts: any, handler: any): boolean {
      const config = getConfig();
      
      // 如果禁用了 undici 拦截，直接调用原始 dispatch
      if (!config.interceptUndici) {
        return dispatch(opts, handler);
      }

      // 构建完整 URL
      // 注意：path 可能是完整 URL（代理场景）或相对路径
      const origin = opts.origin?.toString() || '';
      const path = opts.path || '/';
      
      // 如果 path 已经是完整 URL（以 http:// 或 https:// 开头），直接使用
      // 否则拼接 origin 和 path
      const url = (path.startsWith('http://') || path.startsWith('https://')) 
        ? path 
        : `${origin}${path}`;

      console.log('[undici-patcher] 拦截到请求:', opts.method || 'GET', url);

      // 检查是否应该忽略此 URL
      for (const pattern of config.ignoreUrls) {
        if (pattern.test(url)) {
          return dispatch(opts, handler);
        }
      }

      const requestId = generateRequestId();
      const stackTrace = captureStackTrace();
      // 优先使用上下文管理器的 TraceID，其次使用回调，最后自动生成
      const traceId = getCurrentTraceId() || getTraceIdCallback?.() || `trace_${nanoid(16)}`;
      const timestamp = Date.now();

      // 存储请求数据
      const requestData: RequestData = {
        id: requestId,
        traceId,
        url,
        method: opts.method || 'GET',
        headers: headersToRecord(opts.headers),
        stackTrace,
        timestamp,
      };

      // 捕获请求体
      if (!config.disableBodyCapture && opts.body) {
        if (typeof opts.body === 'string') {
          requestData.body = Buffer.from(opts.body);
        } else if (Buffer.isBuffer(opts.body)) {
          requestData.body = opts.body;
        }
      }

      getRequestStore().add(requestData);
      console.log('[undici-patcher] 请求已添加到存储:', requestId, url);

      // 通知 Event Bridge
      try {
        const eventBridge = getEventBridge();
        if (eventBridge.isRunning()) {
          eventBridge.emitRequestStart(requestData);
          console.log('[undici-patcher] 已通知 Event Bridge:', requestId);
        }
      } catch (err) {
        console.log('[undici-patcher] Event Bridge 通知失败:', err);
      }

      // 包装 handler 来捕获响应
      const wrappedHandler = createWrappedHandler(handler, requestId, timestamp, config);

      return dispatch(opts, wrappedHandler);
    };
  };
}

/**
 * 创建包装的 handler 来捕获响应数据
 */
function createWrappedHandler(
  originalHandler: any,
  requestId: string,
  timestamp: number,
  config: ReturnType<typeof getConfig>
): any {
  const responseChunks: Buffer[] = [];

  return {
    onConnect(abort: () => void): void {
      if (originalHandler.onConnect) {
        originalHandler.onConnect(abort);
      }
    },

    onError(error: Error): void {
      // 记录错误
      const errorData = {
        message: error.message,
        code: (error as any).code,
      };
      getRequestStore().updateError(requestId, errorData);

      // 通知 Event Bridge
      try {
        const eventBridge = getEventBridge();
        if (eventBridge.isRunning()) {
          eventBridge.emitRequestError(requestId, errorData);
        }
      } catch {
        // 忽略 Event Bridge 错误
      }

      if (originalHandler.onError) {
        originalHandler.onError(error);
      }
    },

    onUpgrade(statusCode: number, headers: any, socket: any): void {
      if (originalHandler.onUpgrade) {
        originalHandler.onUpgrade(statusCode, headers, socket);
      }
    },

    onHeaders(statusCode: number, headers: any, resume: () => void, statusText: string): boolean {
      // 记录响应头
      const responseData: ResponseData = {
        statusCode,
        statusMessage: statusText || '',
        headers: headersToRecord(headers),
      };

      getRequestStore().updateResponse(requestId, responseData);

      // 通知 Event Bridge（响应头已接收）
      try {
        const eventBridge = getEventBridge();
        if (eventBridge.isRunning()) {
          eventBridge.emitRequestComplete(requestId, responseData);
        }
      } catch {
        // 忽略 Event Bridge 错误
      }

      if (originalHandler.onHeaders) {
        return originalHandler.onHeaders(statusCode, headers, resume, statusText);
      }
      return true;
    },

    onData(chunk: Buffer): boolean {
      // 捕获响应体
      if (!config.disableBodyCapture) {
        responseChunks.push(chunk);
      }

      if (originalHandler.onData) {
        return originalHandler.onData(chunk);
      }
      return true;
    },

    onComplete(trailers: any): void {
      // 更新响应体和时序数据
      if (responseChunks.length > 0) {
        const storedReq = getRequestStore().get(requestId);
        if (storedReq && storedReq.response) {
          storedReq.response.body = Buffer.concat(responseChunks);
        }
      }

      getRequestStore().updateTiming(requestId, {
        start: timestamp,
        total: Date.now() - timestamp,
      });

      if (originalHandler.onComplete) {
        originalHandler.onComplete(trailers);
      }
    },

    onBodySent(chunkSize: number, totalBytesSent: number): void {
      if (originalHandler.onBodySent) {
        originalHandler.onBodySent(chunkSize, totalBytesSent);
      }
    },
  };
}

/**
 * 尝试加载 undici 模块
 */
function loadUndici(): UndiciModule | null {
  try {
    return require('undici') as UndiciModule;
  } catch {
    // undici 可能未安装
    return null;
  }
}

/**
 * 安装 Undici/Fetch 拦截器
 */
export function install(): void {
  if (installed) return;

  // 尝试加载 undici
  if (!undici) {
    undici = loadUndici();
  }

  if (!undici) {
    console.warn('[node-network-devtools] undici 模块未找到，fetch 拦截将不可用');
    return;
  }

  // 保存原始 dispatcher
  originalDispatcher = undici.getGlobalDispatcher();
  console.log('[undici-patcher] 原始 dispatcher:', originalDispatcher?.constructor?.name);

  // 创建带拦截器的 Agent
  const interceptingAgent = new undici.Agent().compose(createInterceptor());
  console.log('[undici-patcher] 拦截 Agent 已创建');

  // 设置全局 dispatcher
  undici.setGlobalDispatcher(interceptingAgent);
  console.log('[undici-patcher] 全局 dispatcher 已设置');
  
  // 验证设置
  const currentDispatcher = undici.getGlobalDispatcher();
  console.log('[undici-patcher] 当前 dispatcher:', currentDispatcher?.constructor?.name);

  installed = true;
}

/**
 * 卸载 Undici/Fetch 拦截器
 */
export function uninstall(): void {
  if (!installed || !undici || !originalDispatcher) return;

  // 恢复原始 dispatcher
  undici.setGlobalDispatcher(originalDispatcher);
  originalDispatcher = null;

  installed = false;
}

/**
 * 检查是否已安装
 */
export function isInstalled(): boolean {
  return installed;
}

/**
 * 检查 undici 是否可用
 */
export function isUndiciAvailable(): boolean {
  if (!undici) {
    undici = loadUndici();
  }
  return undici !== null;
}

/**
 * UndiciPatcher 对象
 */
export const UndiciPatcher = {
  install,
  uninstall,
  isInstalled,
  isUndiciAvailable,
  setTraceIdGetter,
};
