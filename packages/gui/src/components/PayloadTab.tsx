/**
 * Payload 标签页组件
 * 
 * 显示请求体，支持 JSON 格式化
 */

import { useMemo } from 'react';

interface PayloadTabProps {
  /** 请求体 */
  body?: string;
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
 * Payload 标签页组件
 */
export function PayloadTab({ body }: PayloadTabProps) {
  const { formatted, isJson } = useMemo(() => {
    if (!body) return { formatted: '', isJson: false };
    return tryFormatJson(body);
  }, [body]);

  if (!body) {
    return (
      <div className="p-3">
        <p className="text-devtools-text-secondary text-xs">无请求体</p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-devtools-text font-medium">请求体</h3>
        {isJson && (
          <span className="text-xs text-devtools-accent">JSON</span>
        )}
      </div>
      <pre className="p-2 bg-devtools-bg-secondary rounded text-devtools-text text-xs overflow-auto max-h-96 whitespace-pre-wrap break-all">
        {formatted}
      </pre>
    </div>
  );
}
