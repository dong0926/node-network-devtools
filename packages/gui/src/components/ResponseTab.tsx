/**
 * Response 标签页组件
 * 
 * 显示响应体，支持 JSON 格式化/原始切换
 * 在格式化模式下使用 JSONViewer 组件提供可折叠的 JSON 展示
 */

import { useState, useMemo } from 'react';
import { JSONViewer } from './JSONViewer';
import { tryParseJSON } from '../utils/json-utils';

interface ResponseTabProps {
  /** 响应体 */
  body?: string;
  /** 响应体是否被截断 */
  bodyTruncated?: boolean;
}

/**
 * Response 标签页组件
 */
export function ResponseTab({ body, bodyTruncated }: ResponseTabProps) {
  const [showFormatted, setShowFormatted] = useState(true);

  // 检查是否是有效的 JSON
  const isJson = useMemo(() => {
    if (!body) return false;
    return tryParseJSON(body) !== null;
  }, [body]);

  if (!body) {
    return (
      <div className="p-3">
        <p className="text-devtools-text-secondary text-xs">无响应体</p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-devtools-text font-medium text-xs">响应体</h3>
        <div className="flex items-center gap-2">
          {bodyTruncated && (
            <span className="text-xs text-devtools-warning">已截断</span>
          )}
          {isJson && (
            <button
              className={`text-xs px-2 py-0.5 rounded ${
                showFormatted
                  ? 'bg-devtools-accent text-devtools-bg'
                  : 'bg-devtools-bg-secondary text-devtools-text-secondary'
              }`}
              onClick={() => setShowFormatted(!showFormatted)}
            >
              {showFormatted ? '格式化' : '原始'}
            </button>
          )}
        </div>
      </div>
      
      {/* 格式化模式：使用 JSONViewer */}
      {showFormatted && isJson ? (
        <div className="max-h-96 overflow-auto">
          <JSONViewer data={body} defaultExpandLevel={1} />
        </div>
      ) : (
        /* 原始模式：显示原始文本 */
        <pre className="p-2 bg-devtools-bg-secondary rounded text-devtools-text text-xs overflow-auto max-h-96 whitespace-pre-wrap break-all">
          {body}
        </pre>
      )}
    </div>
  );
}
