/**
 * 请求状态管理 Hook
 * 
 * 管理请求列表状态，处理请求的添加、更新和清空
 */

import { useState, useCallback, useMemo } from 'react';
import type { WSMessage } from './useWebSocket';

/**
 * 时序数据
 */
export interface TimingData {
  startTime: number;
  dnsLookup?: number;
  tcpConnection?: number;
  tlsHandshake?: number;
  firstByte?: number;
  contentDownload?: number;
  total?: number;
}

/**
 * 请求状态
 */
export type RequestStatus = 'pending' | 'complete' | 'error';

/**
 * UI 请求状态
 */
export interface UIRequest {
  id: string;
  url: string;
  method: string;
  status: RequestStatus;
  statusCode?: number;
  statusText?: string;
  type: string;
  size?: number;
  time?: number;
  startTime: number;
  endTime?: number;
  
  // 详情数据
  requestHeaders: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  timing?: TimingData;
  error?: { code: string; message: string };
  traceId?: string;
  stackTrace?: string;
}

/**
 * 请求开始消息 payload
 */
interface RequestStartPayload {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
  traceId?: string;
  stackTrace?: string;
}

/**
 * 请求完成消息 payload
 */
interface RequestCompletePayload {
  id: string;
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string>;
  body?: string;
  bodyTruncated?: boolean;
  timing?: TimingData;
}

/**
 * 请求错误消息 payload
 */
interface RequestErrorPayload {
  id: string;
  code: string;
  message: string;
}

/**
 * 初始数据消息 payload
 */
interface InitialRequestPayload {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
  traceId?: string;
  stackTrace?: string;
  response?: {
    statusCode: number;
    statusMessage: string;
    headers: Record<string, string>;
    body?: string;
    bodyTruncated?: boolean;
  };
  error?: { code: string; message: string };
  timing?: TimingData;
}

/**
 * 从 URL 推断请求类型
 */
function inferRequestType(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    
    if (pathname.endsWith('.js') || pathname.endsWith('.mjs')) return 'script';
    if (pathname.endsWith('.css')) return 'stylesheet';
    if (pathname.endsWith('.json')) return 'json';
    if (pathname.endsWith('.html') || pathname.endsWith('.htm')) return 'document';
    if (/\.(png|jpg|jpeg|gif|svg|webp|ico)$/.test(pathname)) return 'image';
    if (/\.(woff|woff2|ttf|otf|eot)$/.test(pathname)) return 'font';
    
    return 'fetch';
  } catch {
    return 'fetch';
  }
}

/**
 * 计算响应大小
 */
function calculateSize(body?: string, headers?: Record<string, string>): number | undefined {
  // 优先使用 Content-Length
  if (headers?.['content-length']) {
    const size = parseInt(headers['content-length'], 10);
    if (!isNaN(size)) return size;
  }
  
  // 否则使用 body 长度
  if (body) {
    return new Blob([body]).size;
  }
  
  return undefined;
}

/**
 * 请求状态管理 Hook 返回值
 */
interface UseRequestsReturn {
  /** 请求列表 */
  requests: UIRequest[];
  /** 请求 Map（用于快速查找） */
  requestsMap: Map<string, UIRequest>;
  /** 选中的请求 ID */
  selectedId: string | null;
  /** 选中的请求 */
  selectedRequest: UIRequest | null;
  /** 选择请求 */
  selectRequest: (id: string | null) => void;
  /** 处理 WebSocket 消息 */
  handleMessage: (message: WSMessage) => void;
  /** 清空请求 */
  clearRequests: () => void;
  /** 请求总数 */
  totalCount: number;
  /** 总传输大小 */
  totalSize: number;
}

/**
 * 请求状态管理 Hook
 */
export function useRequests(): UseRequestsReturn {
  const [requestsMap, setRequestsMap] = useState<Map<string, UIRequest>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /**
   * 处理请求开始
   */
  const handleRequestStart = useCallback((payload: RequestStartPayload) => {
    const request: UIRequest = {
      id: payload.id,
      url: payload.url,
      method: payload.method,
      status: 'pending',
      type: inferRequestType(payload.url),
      startTime: payload.timestamp,
      requestHeaders: payload.headers,
      requestBody: payload.body,
      traceId: payload.traceId,
      stackTrace: payload.stackTrace,
    };

    setRequestsMap(prev => {
      const next = new Map(prev);
      next.set(payload.id, request);
      return next;
    });
  }, []);

  /**
   * 处理请求完成
   */
  const handleRequestComplete = useCallback((payload: RequestCompletePayload) => {
    setRequestsMap(prev => {
      const existing = prev.get(payload.id);
      if (!existing) return prev;

      const endTime = Date.now();
      const updated: UIRequest = {
        ...existing,
        status: 'complete',
        statusCode: payload.statusCode,
        statusText: payload.statusMessage,
        responseHeaders: payload.headers,
        responseBody: payload.body,
        timing: payload.timing,
        endTime,
        time: payload.timing?.total ?? (endTime - existing.startTime),
        size: calculateSize(payload.body, payload.headers),
      };

      const next = new Map(prev);
      next.set(payload.id, updated);
      return next;
    });
  }, []);

  /**
   * 处理请求错误
   */
  const handleRequestError = useCallback((payload: RequestErrorPayload) => {
    setRequestsMap(prev => {
      const existing = prev.get(payload.id);
      if (!existing) return prev;

      const endTime = Date.now();
      const updated: UIRequest = {
        ...existing,
        status: 'error',
        error: { code: payload.code, message: payload.message },
        endTime,
        time: endTime - existing.startTime,
      };

      const next = new Map(prev);
      next.set(payload.id, updated);
      return next;
    });
  }, []);

  /**
   * 处理初始数据
   */
  const handleInitialData = useCallback((payload: InitialRequestPayload[]) => {
    const newMap = new Map<string, UIRequest>();

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
        type: inferRequestType(item.url),
        startTime: item.timestamp,
        requestHeaders: item.headers,
        requestBody: item.body,
        responseHeaders: item.response?.headers,
        responseBody: item.response?.body,
        timing: item.timing,
        error: item.error,
        traceId: item.traceId,
        stackTrace: item.stackTrace,
        size: item.response ? calculateSize(item.response.body, item.response.headers) : undefined,
        time: item.timing?.total,
      };

      newMap.set(item.id, request);
    }

    setRequestsMap(newMap);
  }, []);

  /**
   * 处理 WebSocket 消息
   */
  const handleMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'request:start':
        handleRequestStart(message.payload as RequestStartPayload);
        break;
      case 'request:complete':
        handleRequestComplete(message.payload as RequestCompletePayload);
        break;
      case 'request:error':
        handleRequestError(message.payload as RequestErrorPayload);
        break;
      case 'requests:initial':
        handleInitialData(message.payload as InitialRequestPayload[]);
        break;
      case 'requests:clear':
        setRequestsMap(new Map());
        setSelectedId(null);
        break;
    }
  }, [handleRequestStart, handleRequestComplete, handleRequestError, handleInitialData]);

  /**
   * 清空请求
   */
  const clearRequests = useCallback(() => {
    setRequestsMap(new Map());
    setSelectedId(null);
  }, []);

  /**
   * 选择请求
   */
  const selectRequest = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  // 转换为数组（按时间排序）
  const requests = useMemo(() => {
    return Array.from(requestsMap.values()).sort((a, b) => a.startTime - b.startTime);
  }, [requestsMap]);

  // 选中的请求
  const selectedRequest = useMemo(() => {
    return selectedId ? requestsMap.get(selectedId) ?? null : null;
  }, [selectedId, requestsMap]);

  // 统计数据
  const totalCount = requests.length;
  const totalSize = useMemo(() => {
    return requests.reduce((sum, req) => sum + (req.size ?? 0), 0);
  }, [requests]);

  return {
    requests,
    requestsMap,
    selectedId,
    selectedRequest,
    selectRequest,
    handleMessage,
    clearRequests,
    totalCount,
    totalSize,
  };
}
