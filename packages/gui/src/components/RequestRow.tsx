/**
 * 请求行组件
 * 
 * 显示单个请求的基本信息
 */

import { useMemo } from 'react';
import type { UIRequest } from '../hooks';

interface RequestRowProps {
  /** 请求数据 */
  request: UIRequest;
  /** 是否选中 */
  isSelected: boolean;
  /** 点击回调 */
  onClick: () => void;
}

/**
 * 格式化字节大小
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * 格式化耗时
 */
function formatTime(ms: number | undefined): string {
  if (ms === undefined) return '-';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * 获取状态码颜色类名
 */
export function getStatusColorClass(statusCode: number | undefined, status: string): string {
  if (status === 'pending') return 'text-devtools-text-secondary';
  if (status === 'error') return 'text-devtools-error';
  if (!statusCode) return 'text-devtools-text-secondary';

  if (statusCode >= 200 && statusCode < 300) return 'text-devtools-success';
  if (statusCode >= 300 && statusCode < 400) return 'text-devtools-warning';
  if (statusCode >= 400) return 'text-devtools-error';

  return 'text-devtools-text-secondary';
}

/**
 * 请求行组件
 */
export function RequestRow({ request, isSelected, onClick }: RequestRowProps) {
  // 提取 URL 路径
  const urlPath = useMemo(() => {
    try {
      const url = new URL(request.url);
      return url.pathname + url.search;
    } catch {
      return request.url;
    }
  }, [request.url]);

  // 状态显示
  const statusDisplay = useMemo(() => {
    if (request.status === 'pending') return '...';
    if (request.status === 'error') return 'ERR';
    return request.statusCode;
  }, [request.status, request.statusCode]);

  return (
    <div
      className={`h-6 flex items-center px-2 text-xs cursor-pointer hover:bg-devtools-bg-hover ${
        isSelected ? 'bg-devtools-bg-selected' : ''
      }`}
      onClick={onClick}
    >
      {/* 状态码 */}
      <div className={`w-16 ${getStatusColorClass(request.statusCode, request.status)}`}>
        {statusDisplay}
      </div>

      {/* 方法 */}
      <div className="w-16 text-devtools-method">{request.method}</div>

      {/* URL */}
      <div className="flex-1 truncate text-devtools-text" title={request.url}>
        {urlPath}
      </div>

      {/* 类型 */}
      <div className="w-20 text-devtools-text-secondary">{request.type}</div>

      {/* 大小 */}
      <div className="w-20 text-right text-devtools-text-secondary">
        {request.size !== undefined ? formatBytes(request.size) : '-'}
      </div>

      {/* 耗时 */}
      <div className="w-20 text-right text-devtools-text-secondary">
        {formatTime(request.time)}
      </div>
    </div>
  );
}
