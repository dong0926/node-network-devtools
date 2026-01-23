import type { TraceNode } from '../hooks/useRequests';

interface TraceListProps {
  traces: TraceNode[];
  selectedId: string | null;
  onSelectTrace: (id: string | null) => void;
}

/**
 * Trace 列表行组件
 */
function TraceRow({ 
  trace, 
  isSelected, 
  onClick 
}: { 
  trace: TraceNode; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <div
      className={`h-7 flex items-center px-2 border-b border-devtools-border text-xs cursor-default select-none transition-colors ${
        isSelected ? 'bg-devtools-bg-selected' : 'hover:bg-devtools-bg-hover'
      }`}
      onClick={onClick}
    >
      <div className="w-20 font-mono text-devtools-text-secondary truncate">
        {trace.id}
      </div>
      <div className="flex-1 font-medium text-devtools-text truncate">
        {trace.name}
      </div>
      <div className="w-20 text-devtools-text-secondary">
        {trace.type}
      </div>
      <div className="w-24 text-right font-mono text-devtools-text">
        {trace.duration ? `${trace.duration}ms` : '-'}
      </div>
    </div>
  );
}

/**
 * Trace 列表表头
 */
function TraceListHeader() {
  return (
    <div className="h-6 flex items-center px-2 border-b border-devtools-border bg-devtools-bg-secondary text-xs text-devtools-text-secondary select-none">
      <div className="w-20">Trace ID</div>
      <div className="flex-1">Transaction / Route</div>
      <div className="w-20">Type</div>
      <div className="w-24 text-right">Duration</div>
    </div>
  );
}

/**
 * Trace 列表组件
 */
export function TraceList({
  traces,
  selectedId,
  onSelectTrace,
}: TraceListProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-devtools-bg">
      <TraceListHeader />
      <div className="flex-1 overflow-auto">
        {traces.length > 0 ? (
          traces.map(trace => (
            <TraceRow
              key={trace.id}
              trace={trace}
              isSelected={String(trace.id) === selectedId || (trace as any).requestId === selectedId}
              onClick={() => onSelectTrace((trace as any).requestId || String(trace.id))}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-devtools-text-secondary">
            <div className="text-center">
              <p className="text-sm">暂无 Server Traces</p>
              <p className="text-xs mt-1">确保 NND_TRACE_ENABLED=true 且有进入请求</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
