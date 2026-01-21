/**
 * 状态栏组件
 * 
 * 显示请求总数、传输大小、连接状态
 */

import type { ConnectionStatus } from '../hooks';

interface StatusBarProps {
  /** 显示的请求数（过滤后） */
  displayCount: number;
  /** 总请求数 */
  totalCount: number;
  /** 总传输大小（字节） */
  totalSize: number;
  /** 连接状态 */
  connectionStatus: ConnectionStatus;
  /** 是否暂停 */
  isPaused: boolean;
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
 * 获取连接状态文本
 */
function getConnectionStatusText(status: ConnectionStatus): string {
  switch (status) {
    case 'connecting': return '连接中...';
    case 'connected': return '已连接';
    case 'disconnected': return '未连接';
    case 'error': return '连接错误';
  }
}

/**
 * 获取连接状态颜色类名
 */
function getConnectionStatusColorClass(status: ConnectionStatus): string {
  switch (status) {
    case 'connected': return 'text-devtools-success';
    case 'connecting': return 'text-devtools-warning';
    default: return 'text-devtools-error';
  }
}

/**
 * 状态栏组件
 */
export function StatusBar({
  displayCount,
  totalCount,
  totalSize,
  connectionStatus,
  isPaused,
}: StatusBarProps) {
  const showFiltered = displayCount !== totalCount;

  return (
    <footer className="h-6 flex items-center px-2 sm:px-4 border-t border-devtools-border bg-devtools-bg-secondary text-xs text-devtools-text-secondary overflow-x-auto">
      {/* 请求数 */}
      <span className="whitespace-nowrap">
        {showFiltered ? `${displayCount} / ${totalCount}` : totalCount} 个请求
      </span>

      <span className="mx-1 sm:mx-2">|</span>

      {/* 传输大小 */}
      <span className="whitespace-nowrap">{formatBytes(totalSize)} 传输</span>

      {/* 暂停状态 */}
      {isPaused && (
        <>
          <span className="mx-1 sm:mx-2">|</span>
          <span className="text-devtools-warning whitespace-nowrap">已暂停</span>
        </>
      )}

      {/* 弹性空间 */}
      <div className="flex-1 min-w-2" />

      {/* 连接状态 */}
      <span className={`${getConnectionStatusColorClass(connectionStatus)} whitespace-nowrap`}>
        {getConnectionStatusText(connectionStatus)}
      </span>
    </footer>
  );
}
