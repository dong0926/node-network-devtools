/**
 * 详情面板组件
 * 
 * 显示选中请求的详细信息，包含标签页切换
 */

import { useState, useEffect } from 'react';
import { HeadersTab } from './HeadersTab';
import { PayloadTab } from './PayloadTab';
import { ResponseTab } from './ResponseTab';
import { TimingTab } from './TimingTab';
import ServerTracePanel from './ServerTracePanel';
import { Resizer } from './Resizer';
import { useResizablePanel } from '../hooks/useResizablePanel';
import type { UIRequest, TraceNode } from '../hooks';

interface DetailPanelProps {
  /** 选中的请求 */
  request: UIRequest;
  /** 追踪数据 */
  trace?: TraceNode;
  /** 初始宽度（可选，像素） */
  initialWidth?: number;
  /** 初始标签页 */
  initialTab?: TabType;
}

/**
 * 标签页类型
 */
type TabType = 'headers' | 'payload' | 'response' | 'timing' | 'trace';

/**
 * 详情面板组件
 */
export function DetailPanel({ request, trace, initialWidth, initialTab }: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'headers');

  // 当外部强制改变 initialTab 时（比如从不同列表切换），同步状态
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, request.id]);

  // 标签页配置
  const tabs: { id: TabType; label: string; show: boolean }[] = [
    { id: 'headers', label: 'Headers', show: true },
    { id: 'payload', label: 'Payload', show: !!request.requestBody },
    { id: 'response', label: 'Response', show: !!request.responseBody },
    { id: 'timing', label: 'Timing', show: !!request.timing || !!request.time },
    { id: 'trace', label: 'Trace', show: !!trace },
  ];

  // 使用可调整大小面板 Hook
  const { width, setWidth, resetWidth, startDragging, stopDragging } = useResizablePanel({
    defaultWidth: initialWidth ?? '40%',
    minWidth: 300,
    maxWidth: '80%',
    storageKey: 'nnd-detail-panel-width',
  });

  return (
    <div className="h-full flex flex-row bg-devtools-bg w-full md:w-auto relative" style={{ width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${width}px` : '100%' }}>
      {/* Resizer 分隔条 - 仅在桌面设备上显示 */}
      <div className="hidden md:block h-full flex-shrink-0">
        <Resizer
          width={width}
          onWidthChange={setWidth}
          minWidth={300}
          maxWidth={typeof window !== 'undefined' ? window.innerWidth * 0.8 : undefined}
          onReset={resetWidth}
          onDragStart={startDragging}
          onDragEnd={stopDragging}
        />
      </div>

      {/* 内容区域 */}
      <div className="flex-1 flex flex-col min-w-0 h-full border-l border-devtools-border md:border-l-0">
        {/* 标签页导航 */}
        <div className="h-7 flex items-center px-2 border-b border-devtools-border bg-devtools-bg shrink-0 overflow-x-auto">
          {tabs.filter(t => t.show).map(tab => (
            <button
              key={tab.id}
              className={`px-2 sm:px-3 py-1 text-xs whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-devtools-accent border-b-2 border-devtools-accent'
                  : 'text-devtools-text-secondary hover:text-devtools-text'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 标签页内容 */}
        <div className="flex-1 overflow-auto text-xs">
          {activeTab === 'headers' && (
            <HeadersTab
              requestHeaders={request.requestHeaders}
              responseHeaders={request.responseHeaders}
            />
          )}
          {activeTab === 'payload' && (
            <PayloadTab body={request.requestBody} url={request.url} />
          )}
          {activeTab === 'response' && (
            <ResponseTab
              body={request.responseBody}
            />
          )}
          {activeTab === 'timing' && (
            <TimingTab
              timing={request.timing}
              totalTime={request.time}
            />
          )}
          {activeTab === 'trace' && trace && (
            <ServerTracePanel trace={trace} />
          )}
        </div>

        {/* 错误信息（如果有） */}
        {request.error && (
          <div className="p-3 border-t border-devtools-border bg-devtools-bg-secondary shrink-0">
            <div className="text-xs text-devtools-error">
              <span className="font-medium">错误:</span> [{request.error.code}] {request.error.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
