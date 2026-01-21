/**
 * Query Parameters 组件
 * 
 * 解析并显示 URL 查询参数
 */

import { useMemo } from 'react';
import { parseQueryParams, type QueryParam } from '../utils/url-parser.js';

interface QueryParametersProps {
  /** 完整的 URL */
  url: string;
}

/**
 * Query Parameters 组件
 * 
 * 以表格形式展示 URL 查询参数，处理空参数和重复参数
 */
export function QueryParameters({ url }: QueryParametersProps) {
  // 解析查询参数
  const params = useMemo(() => parseQueryParams(url), [url]);

  // 如果没有参数，不渲染任何内容
  if (params.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <h3 className="text-devtools-text font-medium mb-2">Query Parameters</h3>
      <div className="border border-devtools-border rounded">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-devtools-bg-secondary border-b border-devtools-border">
              <th className="text-left px-2 py-1.5 font-medium text-devtools-text-secondary w-1/3">
                Name
              </th>
              <th className="text-left px-2 py-1.5 font-medium text-devtools-text-secondary">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {params.map((param: QueryParam, index: number) => (
              <tr
                key={`${param.key}-${index}`}
                className="border-b border-devtools-border last:border-b-0 hover:bg-devtools-bg-secondary/50"
              >
                <td className="px-2 py-1.5 text-devtools-text break-all align-top">
                  {param.key || <span className="text-devtools-text-secondary italic">(empty)</span>}
                </td>
                <td className="px-2 py-1.5 text-devtools-text break-all align-top">
                  {param.value || <span className="text-devtools-text-secondary italic">(empty)</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
