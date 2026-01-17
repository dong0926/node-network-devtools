/**
 * 上下文管理器
 * 
 * 使用 AsyncLocalStorage 实现请求追踪上下文
 * 支持跨异步边界传递 TraceID
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { nanoid } from 'nanoid';

/**
 * 追踪上下文接口
 */
export interface TraceContext {
  /** 追踪 ID */
  traceId: string;
  /** 父追踪 ID（用于嵌套追踪） */
  parentTraceId?: string;
  /** 上下文创建时间 */
  startTime: number;
  /** 自定义元数据 */
  metadata?: Record<string, unknown>;
}

// AsyncLocalStorage 实例
const asyncLocalStorage = new AsyncLocalStorage<TraceContext>();

/**
 * 生成唯一的 TraceID
 */
export function generateTraceId(): string {
  return `trace_${nanoid(16)}`;
}

/**
 * 获取当前追踪上下文
 */
export function getCurrentContext(): TraceContext | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * 获取当前 TraceID
 */
export function getCurrentTraceId(): string | undefined {
  return asyncLocalStorage.getStore()?.traceId;
}

/**
 * 开始新的追踪
 * 
 * @param traceId 可选的 TraceID，不提供则自动生成
 * @param metadata 可选的元数据
 * @returns 新的追踪上下文
 */
export function startTrace(traceId?: string, metadata?: Record<string, unknown>): TraceContext {
  const currentContext = getCurrentContext();
  
  const context: TraceContext = {
    traceId: traceId || generateTraceId(),
    parentTraceId: currentContext?.traceId,
    startTime: Date.now(),
    metadata,
  };

  return context;
}

/**
 * 在追踪上下文中运行函数
 * 
 * @param context 追踪上下文
 * @param fn 要运行的函数
 * @returns 函数的返回值
 */
export function runWithContext<T>(context: TraceContext, fn: () => T): T {
  return asyncLocalStorage.run(context, fn);
}

/**
 * 在新的追踪上下文中运行函数
 * 
 * @param fn 要运行的函数
 * @param traceId 可选的 TraceID
 * @param metadata 可选的元数据
 * @returns 函数的返回值
 */
export function runWithTrace<T>(
  fn: () => T,
  traceId?: string,
  metadata?: Record<string, unknown>
): T {
  const context = startTrace(traceId, metadata);
  return runWithContext(context, fn);
}

/**
 * 在新的追踪上下文中运行异步函数
 * 
 * @param fn 要运行的异步函数
 * @param traceId 可选的 TraceID
 * @param metadata 可选的元数据
 * @returns Promise
 */
export async function runWithTraceAsync<T>(
  fn: () => Promise<T>,
  traceId?: string,
  metadata?: Record<string, unknown>
): Promise<T> {
  const context = startTrace(traceId, metadata);
  return asyncLocalStorage.run(context, fn);
}

/**
 * 更新当前上下文的元数据
 * 
 * @param metadata 要合并的元数据
 */
export function updateContextMetadata(metadata: Record<string, unknown>): void {
  const context = getCurrentContext();
  if (context) {
    context.metadata = {
      ...context.metadata,
      ...metadata,
    };
  }
}

/**
 * 获取追踪持续时间（毫秒）
 */
export function getTraceDuration(): number | undefined {
  const context = getCurrentContext();
  if (context) {
    return Date.now() - context.startTime;
  }
  return undefined;
}

/**
 * 创建获取当前 TraceID 的回调函数
 * 用于传递给拦截器
 */
export function createTraceIdGetter(): () => string | undefined {
  return getCurrentTraceId;
}

/**
 * ContextManager 对象
 */
export const ContextManager = {
  generateTraceId,
  getCurrentContext,
  getCurrentTraceId,
  startTrace,
  runWithContext,
  runWithTrace,
  runWithTraceAsync,
  updateContextMetadata,
  getTraceDuration,
  createTraceIdGetter,
};
