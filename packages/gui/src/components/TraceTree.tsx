import { useState, type FC } from 'react';
import type { TraceNode } from '../hooks/useRequests';

interface TraceTreeProps {
  rootNode: TraceNode;
  selectedNodeId?: number;
  onSelectNode: (node: TraceNode) => void;
  hideSystemNoise?: boolean;
}

const colors: Record<string, string> = {
  'HTTP': '#3b82f6',
  'FS': '#10b981',
  'NET': '#f59e0b',
  'JS': '#6b7280',
  'PROMISE': '#8b5cf6',
  'ROOT': '#ef4444',
};

const TraceTreeItem: FC<{
  node: TraceNode;
  depth: number;
  onSelect: (node: TraceNode) => void;
  selectedId?: number;
  rootStartTime: number;
  rootDuration: number;
  hideSystemNoise?: boolean;
}> = ({ node, depth, onSelect, selectedId, rootStartTime, rootDuration, hideSystemNoise }) => {
  // 默认只打开第一层 (Root)，其它的折叠
  const [isExpanded, setIsExpanded] = useState(depth === 0);

  if (hideSystemNoise && (node.type === 'PROMISE' || node.type === 'JS') && (node.duration || 0) < 2 && node.children.length === 0) {
    return null;
  }

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  // 计算时间条的位置和宽度
  const left = ((node.startTime - rootStartTime) / rootDuration) * 100;
  const width = ((node.duration || 0) / rootDuration) * 100;

  return (
    <div className="flex flex-col">
      <div 
        className={`flex items-center h-7 px-2 hover:bg-devtools-bg-hover cursor-default group border-b border-devtools-border/30 ${isSelected ? 'bg-devtools-bg-selected' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
      >
        {/* 层级缩进和展开按钮 */}
        <div className="flex items-center shrink-0" style={{ width: depth * 16 + 20 + 'px' }}>
          <div className="flex-1" />
          {hasChildren && (
            <button 
              className="w-4 h-4 flex items-center justify-center text-devtools-text-secondary hover:text-devtools-text"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
        </div>

        {/* 节点图标和名称 */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[node.type] || '#6b7280' }} />
          <span className="truncate font-mono text-[11px] text-devtools-text">
            {node.name}
          </span>
          <span className="shrink-0 text-[10px] text-devtools-text-tertiary">
            {node.duration}ms
          </span>
        </div>

        {/* 时间线迷你预览 */}
        <div className="w-32 h-2 bg-black/10 rounded-full overflow-hidden relative ml-4 shrink-0 hidden sm:block">
          <div 
            className="absolute h-full"
            style={{ 
              left: Math.max(0, left) + '%', 
              width: Math.max(1, width) + '%',
              backgroundColor: colors[node.type] || '#6b7280'
            }}
          />
        </div>
      </div>

      {/* 子节点递归渲染 */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col">
          {node.children.map(child => (
            <TraceTreeItem 
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              rootStartTime={rootStartTime}
              rootDuration={rootDuration}
              hideSystemNoise={hideSystemNoise}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TraceTree: FC<TraceTreeProps> = ({ rootNode, selectedNodeId, onSelectNode, hideSystemNoise }) => {
  return (
    <div className="flex flex-col overflow-x-auto min-w-full bg-devtools-bg border border-devtools-border rounded">
      <div className="h-6 flex items-center px-2 bg-devtools-bg-secondary text-[10px] font-bold text-devtools-text-secondary uppercase border-b border-devtools-border">
        <div className="flex-1">Call Tree / Execution Flow</div>
        <div className="w-32 ml-4 hidden sm:block text-center">Timeline</div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <TraceTreeItem 
          node={rootNode}
          depth={0}
          onSelect={onSelectNode}
          selectedId={selectedNodeId}
          rootStartTime={rootNode.startTime}
          rootDuration={rootNode.duration || 1}
          hideSystemNoise={hideSystemNoise}
        />
      </div>
    </div>
  );
};
