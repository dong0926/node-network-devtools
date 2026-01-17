/**
 * 请求列表组件
 * 
 * 显示请求列表，包含表头和请求行
 */

import { RequestRow } from './RequestRow';
import type { UIRequest } from '../hooks';

interface RequestListProps {
  /** 请求列表 */
  requests: UIRequest[];
  /** 选中的请求 ID */
  selectedId: string | null;
  /** 选择请求回调 */
  onSelectRequest: (id: string | null) => void;
  /** 总请求数（未过滤） */
  totalCount: number;
}

/**
 * 请求列表表头
 */
function RequestListHeader() {
  return (
    <div className="h-6 flex items-center px-2 border-b border-devtools-border bg-devtools-bg-secondary text-xs text-devtools-text-secondary select-none">
      <div className="w-16">状态</div>
      <div className="w-16">方法</div>
      <div className="flex-1">URL</div>
      <div className="w-20">类型</div>
      <div className="w-20 text-right">大小</div>
      <div className="w-20 text-right">耗时</div>
    </div>
  );
}

/**
 * 空状态组件
 */
function EmptyState({ hasRequests }: { hasRequests: boolean }) {
  return (
    <div className="flex items-center justify-center h-full text-devtools-text-secondary">
      <div className="text-center">
        <p className="text-sm">
          {hasRequests ? '没有匹配的请求' : '暂无请求'}
        </p>
        <p className="text-xs mt-1">
          {hasRequests ? '尝试调整过滤条件' : '等待网络请求...'}
        </p>
      </div>
    </div>
  );
}

/**
 * 请求列表组件
 */
export function RequestList({
  requests,
  selectedId,
  onSelectRequest,
  totalCount,
}: RequestListProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 表头 */}
      <RequestListHeader />

      {/* 请求列表内容 */}
      <div className="flex-1 overflow-auto">
        {requests.length > 0 ? (
          requests.map(request => (
            <RequestRow
              key={request.id}
              request={request}
              isSelected={request.id === selectedId}
              onClick={() => onSelectRequest(request.id)}
            />
          ))
        ) : (
          <EmptyState hasRequests={totalCount > 0} />
        )}
      </div>
    </div>
  );
}
