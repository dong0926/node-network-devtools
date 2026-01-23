import { AsyncLocalStorage } from 'node:async_hooks';
import { getConfig } from '../config.js';

/**
 * 追踪节点类型
 */
export type TraceNodeType = 'HTTP' | 'FS' | 'NET' | 'JS' | 'PROMISE' | 'ROOT';

/**
 * 追踪节点
 */
export interface TraceNode {
  id: number;
  parentId?: number;
  name: string;
  type: TraceNodeType;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
  stack?: string;
  children: TraceNode[];
}

/**
 * 单次请求的追踪会话
 */
export interface TraceSession {
  requestId: string;
  rootNode: TraceNode;
  nodesMap: Map<number, TraceNode>;
  nodeCount: number;
  isTruncated: boolean;
}

const traceStorage = new AsyncLocalStorage<TraceSession>();

/**
 * 追踪管理器
 */
export class TraceManager {
  private static instance: TraceManager;
  private enabled: boolean = false;

  private constructor() {
    this.enabled = getConfig().traceEnabled;
  }

  public static getInstance(): TraceManager {
    if (!TraceManager.instance) {
      TraceManager.instance = new TraceManager();
    }
    return TraceManager.instance;
  }

  /**
   * 是否开启追踪
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 初始化请求追踪会话
   */
  public createSession(requestId: string, name: string): TraceSession {
    const rootNode: TraceNode = {
      id: 0,
      name,
      type: 'ROOT',
      startTime: Date.now(),
      children: [],
    };

    const session: TraceSession = {
      requestId,
      rootNode,
      nodesMap: new Map([[0, rootNode]]),
      nodeCount: 1,
      isTruncated: false,
    };

    return session;
  }

  /**
   * 在当前上下文中运行
   */
  public run<T>(session: TraceSession, fn: () => T): T {
    return traceStorage.run(session, fn);
  }

  /**
   * 获取当前会话
   */
  public getSession(): TraceSession | undefined {
    return traceStorage.getStore();
  }

  /**
   * 添加节点
   */
  public addNode(parentId: number, name: string, type: TraceNodeType, metadata?: Record<string, any>): number | undefined {
    const session = this.getSession();
    if (!session) return undefined;

    const config = getConfig();
    if (session.nodeCount >= config.traceMaxNodes) {
      if (!session.isTruncated) {
        console.warn(`[trace-manager] ⚠️ Trace nodes limit reached (${config.traceMaxNodes}) for request ${session.requestId}. Further nodes will be ignored.`);
        session.isTruncated = true;
      }
      return undefined;
    }

    const id = session.nodeCount++;
    const node: TraceNode = {
      id,
      parentId,
      name,
      type,
      startTime: Date.now(),
      metadata,
      children: [],
    };

    session.nodesMap.set(id, node);
    
    const parent = session.nodesMap.get(parentId);
    if (parent) {
      parent.children.push(node);
    }

    return id;
  }

  /**
   * 结束节点
   */
  public endNode(id: number): void {
    const session = this.getSession();
    if (!session) return;

    const node = session.nodesMap.get(id);
    if (node) {
      node.endTime = Date.now();
      node.duration = node.endTime - node.startTime;
    }
  }
}

export const traceManager = TraceManager.getInstance();
