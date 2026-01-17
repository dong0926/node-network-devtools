/**
 * HTTP 模块拦截器
 * 
 * 使用 @mswjs/interceptors 库拦截 HTTP 请求
 * 这是一个专门为此设计的库，支持 ESM 和 CJS
 */

import { ClientRequestInterceptor } from '@mswjs/interceptors/ClientRequest';
import { nanoid } from 'nanoid';
import { getRequestStore, type RequestData, type ResponseData } from '../store/ring-buffer.js';
import { getConfig } from '../config.js';
import { getEventBridge } from '../gui/event-bridge.js';

let installed = false;
let interceptor: ClientRequestInterceptor | null = null;

// 用于获取当前 TraceID 的回调（由 ContextManager 设置）
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
  
  // 过滤掉内部栈帧
  const lines = stack.split('\n');
  const filteredLines = lines.filter(line => {
    if (line.trim().startsWith('Error')) return false;
    if (line.includes('http-patcher')) return false;
    if (line.includes('node:http')) return false;
    if (line.includes('node:https')) return false;
    if (line.includes('node:_http')) return false;
    if (line.includes('@mswjs/interceptors')) return false;
    return true;
  });

  return filteredLines.join('\n');
}

/**
 * 将 headers 转换为 Record 格式
 */
function headersToRecord(headers: Headers): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value;
  });
  return result;
}

// 存储请求元数据
const requestMetadata = new Map<string, {
  requestId: string;
  traceId: string;
  stackTrace: string;
  timestamp: number;
}>();

/**
 * 安装 HTTP 拦截器
 */
export function install(): void {
  if (installed) return;

  interceptor = new ClientRequestInterceptor();
  
  // 监听请求事件
  interceptor.on('request', async ({ request, requestId }) => {
    const config = getConfig();
    if (!config.interceptHttp) return;

    const url = request.url;
    
    // 检查是否应该忽略此 URL
    for (const pattern of config.ignoreUrls) {
      if (pattern.test(url)) {
        return;
      }
    }

    const myRequestId = generateRequestId();
    const stackTrace = captureStackTrace();
    const traceId = getTraceIdCallback?.() || `trace_${nanoid(16)}`;
    const timestamp = Date.now();

    // 获取请求体
    let body: Buffer | undefined;
    if (!config.disableBodyCapture && request.body) {
      try {
        const clonedRequest = request.clone();
        const arrayBuffer = await clonedRequest.arrayBuffer();
        body = Buffer.from(arrayBuffer);
      } catch {
        // 忽略错误
      }
    }

    // 存储请求数据
    const requestData: RequestData = {
      id: myRequestId,
      traceId,
      url,
      method: request.method,
      headers: headersToRecord(request.headers),
      body,
      stackTrace,
      timestamp,
    };

    getRequestStore().add(requestData);

    // 通知 Event Bridge
    try {
      const eventBridge = getEventBridge();
      if (eventBridge.isRunning()) {
        eventBridge.emitRequestStart(requestData);
      }
    } catch {
      // 忽略 Event Bridge 错误
    }

    // 存储元数据以便在响应时使用
    requestMetadata.set(requestId, {
      requestId: myRequestId,
      traceId,
      stackTrace,
      timestamp,
    });
  });

  // 监听响应事件
  interceptor.on('response', async ({ response, requestId }) => {
    const metadata = requestMetadata.get(requestId);
    if (!metadata) return;

    const config = getConfig();

    // 获取响应体
    let responseBody: Buffer | undefined;
    if (!config.disableBodyCapture) {
      try {
        const clonedResponse = response.clone();
        const arrayBuffer = await clonedResponse.arrayBuffer();
        responseBody = Buffer.from(arrayBuffer);
      } catch {
        // 忽略错误
      }
    }

    const responseData: ResponseData = {
      statusCode: response.status,
      statusMessage: response.statusText,
      headers: headersToRecord(response.headers),
      body: responseBody,
    };

    getRequestStore().updateResponse(metadata.requestId, responseData);

    // 通知 Event Bridge
    try {
      const eventBridge = getEventBridge();
      if (eventBridge.isRunning()) {
        eventBridge.emitRequestComplete(metadata.requestId, responseData);
      }
    } catch {
      // 忽略 Event Bridge 错误
    }

    // 更新时序数据
    getRequestStore().updateTiming(metadata.requestId, {
      start: metadata.timestamp,
      total: Date.now() - metadata.timestamp,
    });

    // 清理元数据
    requestMetadata.delete(requestId);
  });

  // 启用拦截器
  interceptor.apply();
  installed = true;
}

/**
 * 卸载 HTTP 拦截器
 */
export function uninstall(): void {
  if (!installed || !interceptor) return;

  interceptor.dispose();
  interceptor = null;
  requestMetadata.clear();
  installed = false;
}

/**
 * 检查是否已安装
 */
export function isInstalled(): boolean {
  return installed;
}

/**
 * HttpPatcher 类（用于导出）
 */
export const HttpPatcher = {
  install,
  uninstall,
  isInstalled,
  setTraceIdGetter,
};
