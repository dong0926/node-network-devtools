/**
 * Response 标签页组件
 * 
 * 显示响应体，支持 JSON 格式化/原始切换
 */

import { useState, useMemo } from 'react';

interface ResponseTabProps {
  /** 响应体 */
  body?: string;
  /** 响应体是否被截断 */
  bodyTruncated?: boolean;
}

/**
 * 尝试格式化 JSON
 */
function tryFormatJson(text: string): { formatted: string; isJson: boolean } {
  try {
    const parsed = JSON.parse(text);
    return {
      formatted: JSON.stringify(parsed, null, 2),
      isJson: true,
    };
  } catch {
    return {
      formatted: text,
      isJson: false,
    };
  }
}

/**
 * Response 标签页组件
 */
export function ResponseTab({ body, bodyTruncated }: ResponseTabProps) {
  const [showFormatted, setShowFormatted] = useState(true);

  const { formatted, isJson } = useMemo(() => {
    if (!body) return { formatted: '', isJson: false };
    return tryFormatJson(body);
  }, [body]);

  if (!body) {
    return (
      <div className="p-3">
        <p className="text-devtools-text-secondary text-xs">无响应体</p>
      </div>
    );
  }

  const displayContent = showFormatted && isJson ? formatted : body;

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-devtools-text font-medium">响应体</h3>
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
      <pre className="p-2 bg-devtools-bg-secondary rounded text-devtools-text text-xs overflow-auto max-h-96 whitespace-pre-wrap break-all">
        {displayContent}
      </pre>
    </div>
  );
}
