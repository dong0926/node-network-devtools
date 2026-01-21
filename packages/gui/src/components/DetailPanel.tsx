/**
 * 详情面板组件
 * 
 * 显示选中请求的详细信息，包含标签页切换
 */

import { useState } from 'react';
import { HeadersTab } from './HeadersTab';
import { PayloadTab } from './PayloadTab';
import { ResponseTab } from './ResponseTab';
import { TimingTab } from './TimingTab';
import { Resizer } from './Resizer';
import { useResizablePanel } from '../hooks/useResizablePanel';
import type { UIRequest } from '../hooks';

interface DetailPanelProps {
  /** 选中的请求 */
  request: UIRequest;
  /** 初始宽度（可选，像素） */
  initialWidth?: number;
}

/**
 * 标签页类型
 */
type TabType = 'headers' | 'payload' | 'response' | 'timing';

/**
 * 标签页配置
 */
const TABS: { id: TabType; label: string }[] = [
  { id: 'headers', label: 'Headers' },
  { id: 'payload', label: 'Payload' },
  { id: 'response', label: 'Response' },
  { id: 'timing', label: 'Timing' },
];

/**
 * 详情面板组件
 */
export function DetailPanel({ request, initialWidth }: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('headers');

  // 使用可调整大小面板 Hook
  const { width, setWidth, resetWidth, startDragging, stopDragging } = useResizablePanel({
    defaultWidth: initialWidth ?? '40%',
    minWidth: 300,
    maxWidth: '80%',
    storageKey: 'nnd-detail-panel-width',
  });

  return (
    <div className="h-full border-l border-devtools-border flex flex-col bg-devtools-bg w-full md:w-auto" style={{ width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${width}px` : '100%' }}>
      {/* Resizer 分隔条 - 仅在桌面设备上显示 */}
      <div className="hidden md:block">
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

      {/* 标签页导航 */}
      <div className="h-7 flex items-center px-2 border-b border-devtools-border bg-devtools-bg shrink-0 overflow-x-auto">
        {TABS.map(tab => (
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
  );
}
