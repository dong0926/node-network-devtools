/**
 * 过滤器 Hook
 * 
 * 管理过滤状态，支持 localStorage 持久化
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { UIRequest } from './useRequests';

/**
 * HTTP 方法列表
 */
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const;

/**
 * 状态码分组
 */
export const STATUS_CODE_GROUPS = ['2xx', '3xx', '4xx', '5xx'] as const;

/**
 * 请求类型列表
 */
export const REQUEST_TYPES = ['fetch', 'script', 'stylesheet', 'json', 'document', 'image', 'font', 'other'] as const;

/**
 * 过滤器状态
 */
export interface FilterState {
  /** URL 搜索关键词 */
  search: string;
  /** 选中的 HTTP 方法（空数组表示全部） */
  methods: string[];
  /** 选中的状态码分组（空数组表示全部） */
  statusCodes: string[];
  /** 选中的请求类型（空数组表示全部） */
  types: string[];
}

/**
 * 默认过滤器状态
 */
const DEFAULT_FILTER_STATE: FilterState = {
  search: '',
  methods: [],
  statusCodes: [],
  types: [],
};

/**
 * localStorage 键名
 */
const STORAGE_KEY = 'node-network-devtools-filters';

/**
 * 从 localStorage 加载过滤器状态
 */
function loadFiltersFromStorage(): FilterState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        search: parsed.search ?? '',
        methods: Array.isArray(parsed.methods) ? parsed.methods : [],
        statusCodes: Array.isArray(parsed.statusCodes) ? parsed.statusCodes : [],
        types: Array.isArray(parsed.types) ? parsed.types : [],
      };
    }
  } catch {
    // 忽略解析错误
  }
  return DEFAULT_FILTER_STATE;
}

/**
 * 保存过滤器状态到 localStorage
 */
function saveFiltersToStorage(filters: FilterState): void {
  try {
    // 不保存搜索关键词
    const toSave = {
      methods: filters.methods,
      statusCodes: filters.statusCodes,
      types: filters.types,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // 忽略存储错误
  }
}

/**
 * 检查状态码是否匹配分组
 */
function matchStatusCodeGroup(statusCode: number | undefined, group: string): boolean {
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
 * 过滤器 Hook 返回值
 */
interface UseFiltersReturn {
  /** 过滤器状态 */
  filters: FilterState;
  /** 设置搜索关键词 */
  setSearch: (search: string) => void;
  /** 切换方法过滤 */
  toggleMethod: (method: string) => void;
  /** 切换状态码过滤 */
  toggleStatusCode: (statusCode: string) => void;
  /** 切换类型过滤 */
  toggleType: (type: string) => void;
  /** 重置过滤器 */
  resetFilters: () => void;
  /** 过滤请求列表 */
  filterRequests: (requests: UIRequest[]) => UIRequest[];
  /** 是否有活动过滤器 */
  hasActiveFilters: boolean;
}

/**
 * 过滤器 Hook
 */
export function useFilters(): UseFiltersReturn {
  const [filters, setFilters] = useState<FilterState>(loadFiltersFromStorage);

  // 持久化过滤器状态（不包括搜索关键词）
  useEffect(() => {
    saveFiltersToStorage(filters);
  }, [filters.methods, filters.statusCodes, filters.types]);

  /**
   * 设置搜索关键词
   */
  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  /**
   * 切换方法过滤
   */
  const toggleMethod = useCallback((method: string) => {
    setFilters(prev => {
      const methods = prev.methods.includes(method)
        ? prev.methods.filter(m => m !== method)
        : [...prev.methods, method];
      return { ...prev, methods };
    });
  }, []);

  /**
   * 切换状态码过滤
   */
  const toggleStatusCode = useCallback((statusCode: string) => {
    setFilters(prev => {
      const statusCodes = prev.statusCodes.includes(statusCode)
        ? prev.statusCodes.filter(s => s !== statusCode)
        : [...prev.statusCodes, statusCode];
      return { ...prev, statusCodes };
    });
  }, []);

  /**
   * 切换类型过滤
   */
  const toggleType = useCallback((type: string) => {
    setFilters(prev => {
      const types = prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type];
      return { ...prev, types };
    });
  }, []);

  /**
   * 重置过滤器
   */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTER_STATE);
  }, []);

  /**
   * 过滤请求列表
   */
  const filterRequests = useCallback((requests: UIRequest[]): UIRequest[] => {
    return requests.filter(request => {
      // URL 搜索过滤
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!request.url.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // 方法过滤
      if (filters.methods.length > 0) {
        if (!filters.methods.includes(request.method)) {
          return false;
        }
      }

      // 状态码过滤
      if (filters.statusCodes.length > 0) {
        const matches = filters.statusCodes.some(group => 
          matchStatusCodeGroup(request.statusCode, group)
        );
        // 对于 pending 状态的请求，如果有状态码过滤，则不显示
        if (!matches && request.status !== 'pending') {
          return false;
        }
        // pending 状态的请求在有状态码过滤时不显示
        if (request.status === 'pending') {
          return false;
        }
      }

      // 类型过滤
      if (filters.types.length > 0) {
        if (!filters.types.includes(request.type)) {
          return false;
        }
      }

      return true;
    });
  }, [filters]);

  /**
   * 是否有活动过滤器
   */
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.methods.length > 0 ||
      filters.statusCodes.length > 0 ||
      filters.types.length > 0
    );
  }, [filters]);

  return {
    filters,
    setSearch,
    toggleMethod,
    toggleStatusCode,
    toggleType,
    resetFilters,
    filterRequests,
    hasActiveFilters,
  };
}
