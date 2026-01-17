/**
 * 过滤工具函数
 * 
 * 提供请求过滤的核心逻辑
 */

import type { UIRequest } from '../hooks';

/**
 * URL 搜索过滤
 * 
 * @param request - 请求对象
 * @param search - 搜索关键词
 * @returns 是否匹配
 */
export function matchUrlSearch(request: UIRequest, search: string): boolean {
  if (!search) return true;
  const searchLower = search.toLowerCase();
  return request.url.toLowerCase().includes(searchLower);
}

/**
 * HTTP 方法过滤
 * 
 * @param request - 请求对象
 * @param methods - 选中的方法列表（空数组表示全部）
 * @returns 是否匹配
 */
export function matchMethod(request: UIRequest, methods: string[]): boolean {
  if (methods.length === 0) return true;
  return methods.includes(request.method);
}

/**
 * 状态码分组过滤
 * 
 * @param statusCode - 状态码
 * @param group - 状态码分组（如 '2xx', '3xx'）
 * @returns 是否匹配
 */
export function matchStatusCodeGroup(statusCode: number | undefined, group: string): boolean {
  if (statusCode === undefined) return false;
  
  switch (group) {
    case '2xx': return statusCode >= 200 && statusCode < 300;
    case '3xx': return statusCode >= 300 && statusCode < 400;
    case '4xx': return statusCode >= 400 && statusCode < 500;
    case '5xx': return statusCode >= 500 && statusCode < 600;
    default: return false;
  }
}

/**
 * 状态码过滤
 * 
 * @param request - 请求对象
 * @param statusCodes - 选中的状态码分组列表（空数组表示全部）
 * @returns 是否匹配
 */
export function matchStatusCode(request: UIRequest, statusCodes: string[]): boolean {
  if (statusCodes.length === 0) return true;
  
  // pending 状态的请求在有状态码过滤时不显示
  if (request.status === 'pending') return false;
  
  return statusCodes.some(group => matchStatusCodeGroup(request.statusCode, group));
}

/**
 * 请求类型过滤
 * 
 * @param request - 请求对象
 * @param types - 选中的类型列表（空数组表示全部）
 * @returns 是否匹配
 */
export function matchType(request: UIRequest, types: string[]): boolean {
  if (types.length === 0) return true;
  return types.includes(request.type);
}

/**
 * 过滤器状态
 */
export interface FilterCriteria {
  search: string;
  methods: string[];
  statusCodes: string[];
  types: string[];
}

/**
 * 综合过滤函数
 * 
 * @param request - 请求对象
 * @param criteria - 过滤条件
 * @returns 是否匹配所有条件
 */
export function matchAllCriteria(request: UIRequest, criteria: FilterCriteria): boolean {
  return (
    matchUrlSearch(request, criteria.search) &&
    matchMethod(request, criteria.methods) &&
    matchStatusCode(request, criteria.statusCodes) &&
    matchType(request, criteria.types)
  );
}

/**
 * 过滤请求列表
 * 
 * @param requests - 请求列表
 * @param criteria - 过滤条件
 * @returns 过滤后的请求列表
 */
export function filterRequests(requests: UIRequest[], criteria: FilterCriteria): UIRequest[] {
  return requests.filter(request => matchAllCriteria(request, criteria));
}
