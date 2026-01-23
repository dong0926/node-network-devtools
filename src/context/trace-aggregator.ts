import { type TraceNode, type TraceSession } from './trace-manager.js';
import { getConfig } from '../config.js';

/**
 * 追踪聚合器
 * 负责将扁平的节点列表转换为压缩后的树结构
 */
export const TraceAggregator = {
  /**
   * 聚合会话数据
   */
  aggregate(session: TraceSession): TraceNode {
    const config = getConfig();
    const root = session.rootNode;

    // 递归压缩
    this.compressNode(root, config.traceThresholdMs);

    return root;
  },

  /**
   * 递归压缩节点
   */
  compressNode(node: TraceNode, thresholdMs: number): void {
    if (!node.children || node.children.length === 0) return;

    const newChildren: TraceNode[] = [];

    for (const child of node.children) {
      // 递归处理子节点
      this.compressNode(child, thresholdMs);

      // 压缩规则：折叠短耗时的 Promise 或 JS 内部节点
      if ((child.type === 'PROMISE' || child.type === 'JS') && 
          child.duration !== undefined && 
          child.duration < thresholdMs &&
          child.children.length <= 1) {
        
        // 如果子节点只有一个孩子，则把那个孩子直接提上来
        if (child.children.length === 1) {
          const grandChild = child.children[0];
          grandChild.parentId = node.id;
          newChildren.push(grandChild);
        }
        // 如果没有孩子且耗时极短，则直接丢弃（降噪）
        else {
          // Skip
        }
      } else {
        newChildren.push(child);
      }
    }

    node.children = newChildren;
  }
};
