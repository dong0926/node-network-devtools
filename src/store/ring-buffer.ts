/**
 * 环形缓冲区请求存储
 * 
 * 高效存储和查询请求数据，自动覆盖旧条目
 */

import { getConfig } from '../config.js';

/**
 * 响应数据
 */
export interface ResponseData {
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string | string[]>;
  body?: Buffer | string;
  bodyTruncated?: boolean;
}

/**
 * 错误数据
 */
export interface ErrorData {
  code: string;
  message: string;
  stack?: string;
}

/**
 * 时序数据
 */
export interface TimingData {
  start: number;
  dnsLookup?: number;
  tcpConnection?: number;
  tlsHandshake?: number;
  firstByte?: number;
  download?: number;
  total: number;
}

/**
 * 请求数据
 */
export interface RequestData {
  id: string;
  traceId?: string;
  url: string;
  method: string;
  headers: Record<string, string | string[]>;
  body?: Buffer | string;
  bodyTruncated?: boolean;
  stackTrace: string;
  timestamp: number;
  response?: ResponseData;
  error?: ErrorData;
  timing?: TimingData;
}

/**
 * 查询过滤器
 */
export interface QueryFilter {
  urlPattern?: RegExp | string;
  statusCode?: number;
  statusCodeMin?: number;
  statusCodeMax?: number;
  method?: string;
  traceId?: string;
}

/**
 * 请求存储接口
 */
export interface IRequestStore {
  add(request: RequestData): void;
  updateResponse(id: string, response: ResponseData): void;
  updateTiming(id: string, timing: TimingData): void;
  updateError(id: string, error: ErrorData): void;
  get(id: string): RequestData | undefined;
  getByTraceId(traceId: string): RequestData[];
  query(filter: QueryFilter): RequestData[];
  clear(): void;
  getAll(): RequestData[];
  size(): number;
}

/**
 * 环形缓冲区实现
 */
class RingBufferStore implements IRequestStore {
  private buffer: (RequestData | undefined)[];
  private maxSize: number;
  private maxBodySize: number;
  private writeIndex: number = 0;
  private count: number = 0;
  private idMap: Map<string, number> = new Map();

  constructor(maxSize?: number, maxBodySize?: number) {
    const config = getConfig();
    this.maxSize = maxSize ?? config.maxRequests;
    this.maxBodySize = maxBodySize ?? config.maxBodySize;
    this.buffer = new Array(this.maxSize).fill(undefined);
  }

  /**
   * 截断过大的 body
   */
  private truncateBody(body: Buffer | string | undefined): { body?: Buffer | string; truncated: boolean } {
    if (body === undefined) {
      return { body: undefined, truncated: false };
    }

    const size = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body);
    
    if (size <= this.maxBodySize) {
      return { body, truncated: false };
    }

    if (Buffer.isBuffer(body)) {
      return { body: body.subarray(0, this.maxBodySize), truncated: true };
    } else {
      // 对于字符串，需要小心处理 UTF-8 边界
      const buffer = Buffer.from(body);
      const truncated = buffer.subarray(0, this.maxBodySize);
      return { body: truncated.toString('utf-8'), truncated: true };
    }
  }

  /**
   * 添加请求
   */
  add(request: RequestData): void {
    // 截断请求 body
    const { body: truncatedBody, truncated: bodyTruncated } = this.truncateBody(request.body);
    
    const processedRequest: RequestData = {
      ...request,
      body: truncatedBody,
      bodyTruncated: bodyTruncated || request.bodyTruncated,
    };

    // 计算写入位置
    const position = this.writeIndex % this.maxSize;

    // 清理旧条目的索引
    const oldRequest = this.buffer[position];
    if (oldRequest) {
      this.idMap.delete(oldRequest.id);
    }

    // 写入新条目
    this.buffer[position] = processedRequest;
    this.idMap.set(request.id, position);
    
    this.writeIndex++;
    if (this.count < this.maxSize) {
      this.count++;
    }
  }

  /**
   * 更新响应数据
   */
  updateResponse(id: string, response: ResponseData): void {
    const position = this.idMap.get(id);
    if (position === undefined) return;

    const request = this.buffer[position];
    if (!request) return;

    // 截断响应 body
    const { body: truncatedBody, truncated: bodyTruncated } = this.truncateBody(response.body);

    request.response = {
      ...response,
      body: truncatedBody,
      bodyTruncated: bodyTruncated || response.bodyTruncated,
    };
  }

  /**
   * 更新时序数据
   */
  updateTiming(id: string, timing: TimingData): void {
    const position = this.idMap.get(id);
    if (position === undefined) return;

    const request = this.buffer[position];
    if (!request) return;

    request.timing = timing;
  }

  /**
   * 更新错误数据
   */
  updateError(id: string, error: ErrorData): void {
    const position = this.idMap.get(id);
    if (position === undefined) return;

    const request = this.buffer[position];
    if (!request) return;

    request.error = error;
  }

  /**
   * 根据 ID 获取请求
   */
  get(id: string): RequestData | undefined {
    const position = this.idMap.get(id);
    if (position === undefined) return undefined;
    return this.buffer[position];
  }

  /**
   * 根据 TraceID 获取所有相关请求
   */
  getByTraceId(traceId: string): RequestData[] {
    const results: RequestData[] = [];
    
    for (let i = 0; i < this.count; i++) {
      const position = (this.writeIndex - 1 - i + this.maxSize) % this.maxSize;
      const request = this.buffer[position];
      if (request && request.traceId === traceId) {
        results.push(request);
      }
    }

    return results;
  }

  /**
   * 查询请求
   */
  query(filter: QueryFilter): RequestData[] {
    const results: RequestData[] = [];

    for (let i = 0; i < this.count; i++) {
      const position = (this.writeIndex - 1 - i + this.maxSize) % this.maxSize;
      const request = this.buffer[position];
      if (!request) continue;

      // URL 模式匹配
      if (filter.urlPattern) {
        const pattern = filter.urlPattern instanceof RegExp 
          ? filter.urlPattern 
          : new RegExp(filter.urlPattern);
        if (!pattern.test(request.url)) continue;
      }

      // 状态码匹配
      if (filter.statusCode !== undefined) {
        if (!request.response || request.response.statusCode !== filter.statusCode) continue;
      }

      // 状态码范围匹配
      if (filter.statusCodeMin !== undefined) {
        if (!request.response || request.response.statusCode < filter.statusCodeMin) continue;
      }
      if (filter.statusCodeMax !== undefined) {
        if (!request.response || request.response.statusCode > filter.statusCodeMax) continue;
      }

      // 方法匹配
      if (filter.method !== undefined) {
        if (request.method.toUpperCase() !== filter.method.toUpperCase()) continue;
      }

      // TraceID 匹配
      if (filter.traceId !== undefined) {
        if (request.traceId !== filter.traceId) continue;
      }

      results.push(request);
    }

    return results;
  }

  /**
   * 清空所有请求
   */
  clear(): void {
    this.buffer = new Array(this.maxSize).fill(undefined);
    this.idMap.clear();
    this.writeIndex = 0;
    this.count = 0;
  }

  /**
   * 获取所有请求（按时间倒序）
   */
  getAll(): RequestData[] {
    const results: RequestData[] = [];

    for (let i = 0; i < this.count; i++) {
      const position = (this.writeIndex - 1 - i + this.maxSize) % this.maxSize;
      const request = this.buffer[position];
      if (request) {
        results.push(request);
      }
    }

    return results;
  }

  /**
   * 获取当前存储的请求数量
   */
  size(): number {
    return this.count;
  }
}

// 全局单例
let globalStore: RingBufferStore | null = null;

/**
 * 获取全局请求存储实例
 */
export function getRequestStore(): IRequestStore {
  if (!globalStore) {
    globalStore = new RingBufferStore();
  }
  return globalStore;
}

/**
 * 重置全局请求存储（用于测试）
 */
export function resetRequestStore(): void {
  globalStore = null;
}

/**
 * 创建新的请求存储实例（用于测试）
 */
export function createRequestStore(maxSize?: number, maxBodySize?: number): IRequestStore {
  return new RingBufferStore(maxSize, maxBodySize);
}

// 导出类型别名
export { RingBufferStore as RequestStore };
