import { traceManager, type TraceNodeType } from '../context/trace-manager.js';
import { getConfig } from '../config.js';
import { SmartStackCollector } from '../utils/stack-collector.js';

/**
 * 映射 async_hooks 类型到追踪节点类型
 */
const typeMap: Record<string, TraceNodeType> = {
  'TCPWRAP': 'NET',
  'TCPCONNECTWRAP': 'NET',
  'HTTPPARSER': 'HTTP',
  'HTTPINCOMINGMESSAGE': 'HTTP',
  'HTTPCLIENTREQUEST': 'HTTP',
  'FSREQCALLBACK': 'FS',
  'FSREQPROMISE': 'FS',
  'GETADDRINFOREQWRAP': 'NET',
  'PROMISE': 'PROMISE',
  'TICKOBJECT': 'JS',
  'Timeout': 'JS',
  'Immediate': 'JS',
};

// 重要的资源类型，需要捕获堆栈
const importantTypes = new Set(['NET', 'HTTP', 'FS']);

// 存储 asyncId 到节点 ID 的映射
const asyncIdToNodeId = new Map<number, number>();

/**
 * 追踪收集器
 */
export const TraceCollector = {
  hook: null as any | null,

  async install() {
    if (this.hook) return;
    const config = getConfig();
    if (!config.traceEnabled) return;

    // 延迟加载 async_hooks
    const async_hooks = await import('node:async_hooks');

    this.hook = async_hooks.createHook({
      init: (asyncId, type, triggerAsyncId, resource) => {
        const session = traceManager.getSession();
        if (!session) return;

        // 检查类型是否在感兴趣的列表中
        const nodeType = typeMap[type] || 'JS';
        
        const parentNodeId = asyncIdToNodeId.get(triggerAsyncId) || 0;
        
        let name = type;
        // 如果是 Promise 或 JS 任务，尝试获取更有意义的名称
        if (nodeType === 'PROMISE' || nodeType === 'JS') {
          const caller = SmartStackCollector.getCaller();
          if (caller) {
            name = caller;
          }
        }

        let stack: string | undefined;
        if (importantTypes.has(nodeType)) {
          stack = SmartStackCollector.capture();
        }

        const nodeId = traceManager.addNode(parentNodeId, type, nodeType, { stack });
        if (nodeId !== undefined) {
          asyncIdToNodeId.set(asyncId, nodeId);
        }
      },
      before: (asyncId) => {
        // 可选：记录开始执行时间（如果需要更细粒度的 JS 执行追踪）
      },
      after: (asyncId) => {
        // 可选：记录结束执行时间
      },
      destroy: (asyncId) => {
        const nodeId = asyncIdToNodeId.get(asyncId);
        if (nodeId !== undefined) {
          traceManager.endNode(nodeId);
          // asyncIdToNodeId.delete(asyncId); // 延迟清理或在请求结束时清理
        }
      },
      promiseResolve: (asyncId) => {
        const nodeId = asyncIdToNodeId.get(asyncId);
        if (nodeId !== undefined) {
          traceManager.endNode(nodeId);
        }
      }
    });

    this.hook.enable();
    console.log('[trace-collector] ✅ AsyncHooks Trace Collector enabled');
  },

  uninstall() {
    if (this.hook) {
      this.hook.disable();
      this.hook = null;
    }
    asyncIdToNodeId.clear();
  },

  clearRequestData() {
    // 可以在请求结束时调用，清理 session 相关的映射
    // 由于 asyncId 是全局递增的，长期运行可能会导致 Map 过大
    // 但在开发环境下，单次运行通常还好
  }
};
