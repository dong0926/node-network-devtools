import { useState, useMemo, type FC } from 'react';
import type { TraceNode } from '../hooks/useRequests';
import { TraceTree } from './TraceTree';

interface ServerTracePanelProps {
  trace: TraceNode;
}

const ServerTracePanel: FC<ServerTracePanelProps> = ({ trace }) => {
  const [selectedNode, setSelectedNode] = useState<TraceNode | null>(null);
  const [hideSystemNoise, setHideSystemNoise] = useState(true);
  const [viewMode, setViewMode] = useState<'tree' | 'flame'>('tree');

  // 降噪阈值 (毫秒)
  const NOISE_THRESHOLD_MS = 2;

  // 深度优先遍历计算节点的层级和显示 (用于火焰图)
  const flattenedNodes = useMemo(() => {
    const nodes: { node: TraceNode; depth: number; left: number; width: number }[] = [];
    const rootStartTime = trace.startTime;
    const rootDuration = trace.duration || 1; 

    function walk(node: TraceNode, depth: number) {
      if (hideSystemNoise && (node.type === 'PROMISE' || node.type === 'JS') && (node.duration || 0) < NOISE_THRESHOLD_MS) {
        return;
      }

      const left = ((node.startTime - rootStartTime) / rootDuration) * 100;
      const width = ((node.duration || 0) / rootDuration) * 100;

      nodes.push({ node, depth, left, width });
      
      const children = node.children || [];
      for (const child of children) {
        walk(child, depth + 1);
      }
    }

    walk(trace, 0);
    return nodes;
  }, [trace, hideSystemNoise]);

  const maxDepth = Math.max(...flattenedNodes.map(n => n.depth), 0);

  const colors: Record<string, string> = {
    'HTTP': '#3b82f6',
    'FS': '#10b981',
    'NET': '#f59e0b',
    'JS': '#6b7280',
    'PROMISE': '#8b5cf6',
    'ROOT': '#ef4444',
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-devtools-bg">
      <div className="flex items-center justify-between p-2 border-b border-devtools-border bg-devtools-bg-secondary">
        <div className="flex items-center gap-4">
          <h3 className="text-xs font-bold text-devtools-text uppercase tracking-wider">Server Trace</h3>
          
          {/* 视图切换 */}
          <div className="flex bg-devtools-bg rounded p-0.5 border border-devtools-border">
            <button 
              className={`px-2 py-0.5 text-[9px] font-bold rounded ${viewMode === 'tree' ? 'bg-devtools-accent text-devtools-bg' : 'text-devtools-text-secondary hover:text-devtools-text'}`}
              onClick={() => setViewMode('tree')}
            >
              TREE
            </button>
            <button 
              className={`px-2 py-0.5 text-[9px] font-bold rounded ${viewMode === 'flame' ? 'bg-devtools-accent text-devtools-bg' : 'text-devtools-text-secondary hover:text-devtools-text'}`}
              onClick={() => setViewMode('flame')}
            >
              FLAME
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1 text-xs text-devtools-text-secondary cursor-pointer">
            <input 
              type="checkbox" 
              checked={hideSystemNoise} 
              onChange={e => setHideSystemNoise(e.target.checked)}
              className="rounded border-devtools-border"
            />
            Hide System Noise
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2 flex flex-col gap-2">
        {/* Main Trace View */}
        <div className="flex-1 overflow-auto min-h-0">
          {viewMode === 'tree' ? (
            <TraceTree 
              rootNode={trace}
              selectedNodeId={selectedNode?.id}
              onSelectNode={setSelectedNode}
              hideSystemNoise={hideSystemNoise}
            />
          ) : (
            <div className="relative border border-devtools-border rounded bg-devtools-bg-secondary p-2 overflow-x-auto min-h-[300px]">
              <div className="relative" style={{ height: (maxDepth + 1) * 24 + 'px', minWidth: '600px' }}>
                {flattenedNodes.map((n, i) => (
                  <div
                    key={i}
                    className="absolute h-5 text-[10px] flex items-center px-1 overflow-hidden whitespace-nowrap cursor-pointer border border-white/10 hover:brightness-110 transition-all rounded-sm text-white"
                    style={{
                      left: n.left + '%',
                      top: n.depth * 24 + 'px',
                      width: Math.max(n.width, 0.5) + '%',
                      backgroundColor: colors[n.node.type] || '#6b7280',
                      opacity: selectedNode?.id === n.node.id ? 1 : 0.8,
                      zIndex: selectedNode?.id === n.node.id ? 10 : 1
                    }}
                    onClick={() => setSelectedNode(n.node)}
                    title={`${n.node.name} (${n.node.duration}ms)`}
                  >
                    {n.node.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Node Details */}
        <div className="border border-devtools-border rounded bg-devtools-bg-secondary flex flex-col overflow-hidden h-40 shrink-0">
          <div className="p-2 border-b border-devtools-border text-[10px] font-bold text-devtools-text-secondary uppercase">
            Node Details
          </div>
          <div className="flex-1 overflow-auto p-2 font-mono text-xs">
            {selectedNode ? (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-[80px,1fr] gap-x-2 gap-y-1">
                  <span className="text-devtools-text-secondary">Name:</span>
                  <span className="text-devtools-text break-all">{selectedNode.name}</span>
                  
                  <span className="text-devtools-text-secondary">Type:</span>
                  <span className="px-1 rounded text-[10px] text-white w-fit" style={{ backgroundColor: colors[selectedNode.type] }}>
                    {selectedNode.type}
                  </span>
                  
                  <span className="text-devtools-text-secondary">Duration:</span>
                  <span className="text-devtools-text">{selectedNode.duration}ms</span>
                </div>
                
                {selectedNode.stack && (
                  <div className="flex flex-col gap-1 mt-1 border-t border-devtools-border/50 pt-1">
                    <span className="text-devtools-text-secondary">Stack Trace:</span>
                    <pre className="text-[10px] leading-tight text-devtools-text-secondary whitespace-pre-wrap break-all p-1 bg-black/10 rounded">
                      {selectedNode.stack}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-devtools-text-tertiary">
                Select a node to see details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerTracePanel;
