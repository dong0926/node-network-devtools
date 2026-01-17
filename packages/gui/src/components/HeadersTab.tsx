/**
 * Headers 标签页组件
 * 
 * 显示请求头和响应头
 */

interface HeadersTabProps {
  /** 请求头 */
  requestHeaders: Record<string, string>;
  /** 响应头 */
  responseHeaders?: Record<string, string>;
}

/**
 * 头部列表组件
 */
function HeaderList({
  title,
  headers,
}: {
  title: string;
  headers: Record<string, string>;
}) {
  const entries = Object.entries(headers);

  if (entries.length === 0) {
    return (
      <div className="mb-4">
        <h3 className="text-devtools-text font-medium mb-2">{title}</h3>
        <p className="text-devtools-text-secondary text-xs">无</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h3 className="text-devtools-text font-medium mb-2">{title}</h3>
      <div className="space-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="text-xs break-all">
            <span className="text-devtools-header-name">{key}:</span>{' '}
            <span className="text-devtools-text">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Headers 标签页组件
 */
export function HeadersTab({ requestHeaders, responseHeaders }: HeadersTabProps) {
  return (
    <div className="p-3">
      <HeaderList title="请求头" headers={requestHeaders} />
      {responseHeaders && (
        <HeaderList title="响应头" headers={responseHeaders} />
      )}
    </div>
  );
}
