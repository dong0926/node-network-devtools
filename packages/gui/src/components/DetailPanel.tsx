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
import type { UIRequest } from '../hooks';

interface DetailPanelProps {
  /** 选中的请求 */
  request: UIRequest;
  /** 关闭面板回调 */
  onClose: () => void;
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
export function DetailPanel({ request, onClose }: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('headers');

  return (
    <div className="w-96 border-l border-devtools-border flex flex-col bg-devtools-bg">
      {/* 面板头部 */}
      <div className="h-8 flex items-center justify-between px-3 border-b border-devtools-border bg-devtools-bg-secondary shrink-0">
        <span className="text-xs text-devtools-text font-medium truncate flex-1 mr-2">
          {request.method} {request.url}
        </span>
        <button
          className="text-devtools-text-secondary hover:text-devtools-text text-sm"
          onClick={onClose}
          title="关闭"
        >
          ✕
        </button>
      </div>

      {/* 标签页导航 */}
      <div className="h-7 flex items-center px-2 border-b border-devtools-border bg-devtools-bg shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`px-3 py-1 text-xs ${
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
          <PayloadTab body={request.requestBody} />
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
