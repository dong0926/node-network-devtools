/**
 * Next.js 框架适配器
 * 
 * 确保与 Next.js 的 Data Cache 和 Request Memoization 兼容
 * 保留 next.revalidate、next.tags 等选项
 */

import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * 缓存模式类型（与 DOM RequestCache 兼容）
 */
type CacheMode = 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached';

/**
 * Next.js 请求元数据
 */
export interface NextJsMetadata {
  /** 来源路由 */
  route?: string;
  /** 缓存状态 */
  cacheStatus?: 'HIT' | 'MISS' | 'STALE' | 'REVALIDATED';
  /** 重新验证时间 */
  revalidate?: number | false;
  /** 缓存标签 */
  tags?: string[];
  /** 请求类型 */
  requestType?: 'server-component' | 'server-action' | 'route-handler' | 'middleware';
}

/**
 * Next.js fetch 选项
 */
export interface NextJsFetchOptions {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
  cache?: CacheMode;
}

// 用于存储当前路由信息的 AsyncLocalStorage
const routeStorage = new AsyncLocalStorage<{ route: string; type: string }>();

/**
 * 检测是否在 Next.js 环境中
 */
export function isNextJsEnvironment(): boolean {
  // 检查 Next.js 特有的环境变量
  return !!(
    process.env.NEXT_RUNTIME ||
    process.env.__NEXT_PRIVATE_PREBUNDLED_REACT ||
    process.env.NEXT_DEPLOYMENT_ID
  );
}

/**
 * 获取当前路由信息
 */
export function getCurrentRoute(): { route: string; type: string } | undefined {
  return routeStorage.getStore();
}

/**
 * 在指定路由上下文中运行函数
 */
export function runWithRoute<T>(route: string, type: string, fn: () => T): T {
  return routeStorage.run({ route, type }, fn);
}

/**
 * 异步版本的 runWithRoute
 */
export async function runWithRouteAsync<T>(
  route: string, 
  type: string, 
  fn: () => Promise<T>
): Promise<T> {
  return routeStorage.run({ route, type }, fn);
}


/**
 * 提取 Next.js fetch 选项
 */
export function extractNextJsOptions(init?: RequestInit): NextJsFetchOptions | undefined {
  if (!init) return undefined;
  
  const options: NextJsFetchOptions = {};
  
  // 提取 next 选项
  if ('next' in init && init.next) {
    const nextOpts = init.next as { revalidate?: number | false; tags?: string[] };
    options.next = {
      revalidate: nextOpts.revalidate,
      tags: nextOpts.tags,
    };
  }
  
  // 提取 cache 选项
  if ('cache' in init && init.cache) {
    options.cache = init.cache as CacheMode;
  }
  
  return Object.keys(options).length > 0 ? options : undefined;
}

/**
 * 从请求中提取 Next.js 元数据
 */
export function extractNextJsMetadata(
  init?: RequestInit,
  responseHeaders?: Headers | Record<string, string>
): NextJsMetadata {
  const metadata: NextJsMetadata = {};
  
  // 获取当前路由
  const routeInfo = getCurrentRoute();
  if (routeInfo) {
    metadata.route = routeInfo.route;
    metadata.requestType = routeInfo.type as NextJsMetadata['requestType'];
  }
  
  // 提取 fetch 选项
  const nextOptions = extractNextJsOptions(init);
  if (nextOptions?.next) {
    metadata.revalidate = nextOptions.next.revalidate;
    metadata.tags = nextOptions.next.tags;
  }
  
  // 从响应头提取缓存状态
  if (responseHeaders) {
    const cacheStatus = getHeader(responseHeaders, 'x-nextjs-cache');
    if (cacheStatus) {
      metadata.cacheStatus = cacheStatus as NextJsMetadata['cacheStatus'];
    }
  }
  
  return metadata;
}

/**
 * 辅助函数：获取响应头
 */
function getHeader(
  headers: Headers | Record<string, string>,
  name: string
): string | undefined {
  if (headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }
  return headers[name] || headers[name.toLowerCase()];
}

/**
 * 创建 Next.js instrumentation 配置
 */
export function createInstrumentationConfig(): string {
  return `// instrumentation.ts
// 将此文件放在 Next.js 项目根目录

export async function register() {
  // 仅在服务端运行
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 动态导入以避免客户端打包
    const { install } = await import('node-network-devtools');
    await install();
    console.log('[node-network-devtools] 已在 Next.js 服务端初始化');
  }
}
`;
}

/**
 * Next.js 适配器对象
 */
export const NextJsAdapter = {
  isNextJsEnvironment,
  getCurrentRoute,
  runWithRoute,
  runWithRouteAsync,
  extractNextJsOptions,
  extractNextJsMetadata,
  createInstrumentationConfig,
};
