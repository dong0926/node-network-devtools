/**
 * Timing 标签页组件
 * 
 * 显示请求时序图
 */

import type { TimingData } from '../hooks';

interface TimingTabProps {
  /** 时序数据 */
  timing?: TimingData;
  /** 总耗时 */
  totalTime?: number;
}

/**
 * 时序条目组件
 */
function TimingEntry({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number | undefined;
  total: number;
  color: string;
}) {
  if (value === undefined || value === 0) return null;

  const percentage = (value / total) * 100;

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-devtools-text-secondary">{label}</span>
        <span className="text-devtools-text">{value.toFixed(2)} ms</span>
      </div>
      <div className="h-2 bg-devtools-bg-secondary rounded overflow-hidden">
        <div
          className={`h-full ${color}`}
          style={{ width: `${Math.max(percentage, 1)}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Timing 标签页组件
 */
export function TimingTab({ timing, totalTime }: TimingTabProps) {
  if (!timing && !totalTime) {
    return (
      <div className="p-3">
        <p className="text-devtools-text-secondary text-xs">无时序数据</p>
      </div>
    );
  }

  const total = timing?.total ?? totalTime ?? 0;

  return (
    <div className="p-3">
      <h3 className="text-devtools-text font-medium mb-4">请求时序</h3>

      {timing ? (
        <div className="space-y-3">
          <TimingEntry
            label="DNS 查询"
            value={timing.dnsLookup}
            total={total}
            color="bg-blue-500"
          />
          <TimingEntry
            label="TCP 连接"
            value={timing.tcpConnection}
            total={total}
            color="bg-orange-500"
          />
          <TimingEntry
            label="TLS 握手"
            value={timing.tlsHandshake}
            total={total}
            color="bg-purple-500"
          />
          <TimingEntry
            label="首字节时间"
            value={timing.firstByte}
            total={total}
            color="bg-green-500"
          />
          <TimingEntry
            label="内容下载"
            value={timing.contentDownload}
            total={total}
            color="bg-cyan-500"
          />
        </div>
      ) : null}

      {/* 总耗时 */}
      <div className="mt-4 pt-4 border-t border-devtools-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-devtools-text font-medium">总耗时</span>
          <span className="text-devtools-text">{total.toFixed(2)} ms</span>
        </div>
      </div>
    </div>
  );
}
