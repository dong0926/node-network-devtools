/**
 * Payload 标签页组件
 * 
 * 显示请求的查询参数和请求体，支持 JSON 格式化和可折叠展示
 */

import { useMemo } from 'react';
import { QueryParameters } from './QueryParameters.js';
import { JSONViewer } from './JSONViewer.js';
import { tryParseJSON } from '../utils/json-utils.js';

interface PayloadTabProps {
  /** 请求体 */
  body?: string;
  /** 完整的 URL（用于解析查询参数） */
  url: string;
}

/**
 * Payload 标签页组件
 * 
 * 显示查询参数和请求体，使用 Chrome DevTools 风格的布局
 */
export function PayloadTab({ body, url }: PayloadTabProps) {
  // 尝试解析 JSON
  const parsedBody = useMemo(() => {
    if (!body) return null;
    return tryParseJSON(body);
  }, [body]);

  // 检查是否有查询参数
  const hasQueryParams = useMemo(() => {
    try {
      const urlObj = new URL(url);
      return urlObj.search.length > 1; // '?' 后面有内容
    } catch {
      return false;
    }
  }, [url]);

  // 如果既没有查询参数也没有请求体，显示提示
  if (!hasQueryParams && !body) {
    return (
      <div className="p-3">
        <p className="text-devtools-text-secondary text-xs">No request payload</p>
      </div>
    );
  }

  return (
    <div className="p-3">
      {/* Query Parameters 部分 - 仅在有参数时显示 */}
      {hasQueryParams && <QueryParameters url={url} />}

      {/* Request Body 部分 - 仅在有 body 时显示 */}
      {body && (
        <div>
          <h3 className="text-devtools-text font-medium mb-2">Request Body</h3>
          {parsedBody !== null ? (
            // JSON 数据使用 JSONViewer
            <JSONViewer data={parsedBody} defaultExpandLevel={1} />
          ) : (
            // 非 JSON 数据显示原始文本
            <pre className="p-2 bg-devtools-bg-secondary rounded text-devtools-text text-xs overflow-auto max-h-96 whitespace-pre-wrap break-all">
              {body}
            </pre>
          )}
        </div>
      )}

      {/* 如果没有 body 但有查询参数，不显示 "No request body" */}
    </div>
  );
}
