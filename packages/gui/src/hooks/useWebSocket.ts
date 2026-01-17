/**
 * WebSocket 连接 Hook
 * 
 * 管理 WebSocket 连接，支持自动重连（指数退避）
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * WebSocket 消息类型
 */
export type WSMessageType = 
  | 'request:start'
  | 'request:complete'
  | 'request:error'
  | 'requests:initial'
  | 'requests:clear'
  | 'control:pause'
  | 'control:resume';

/**
 * WebSocket 消息
 */
export interface WSMessage {
  type: WSMessageType;
  payload: unknown;
  timestamp: number;
}

/**
 * 连接状态
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * WebSocket Hook 配置
 */
interface UseWebSocketOptions {
  /** WebSocket 端口 */
  port: number | null;
  /** 主机地址，默认 127.0.0.1 */
  host?: string;
  /** 是否自动重连，默认 true */
  autoReconnect?: boolean;
  /** 最大重连次数，默认 10 */
  maxReconnectAttempts?: number;
  /** 初始重连延迟（毫秒），默认 1000 */
  initialReconnectDelay?: number;
  /** 最大重连延迟（毫秒），默认 30000 */
  maxReconnectDelay?: number;
  /** 消息处理回调 */
  onMessage?: (message: WSMessage) => void;
}

/**
 * WebSocket Hook 返回值
 */
interface UseWebSocketReturn {
  /** 连接状态 */
  status: ConnectionStatus;
  /** 发送消息 */
  send: (message: WSMessage) => void;
  /** 手动重连 */
  reconnect: () => void;
  /** 断开连接 */
  disconnect: () => void;
  /** 重连次数 */
  reconnectAttempts: number;
}

/**
 * WebSocket 连接 Hook
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    port,
    host = '127.0.0.1',
    autoReconnect = true,
    maxReconnectAttempts = 10,
    initialReconnectDelay = 1000,
    maxReconnectDelay = 30000,
    onMessage,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const onMessageRef = useRef(onMessage);

  // 更新 onMessage 引用
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  /**
   * 计算重连延迟（指数退避）
   */
  const getReconnectDelay = useCallback((attempt: number): number => {
    const delay = initialReconnectDelay * Math.pow(2, attempt);
    return Math.min(delay, maxReconnectDelay);
  }, [initialReconnectDelay, maxReconnectDelay]);

  /**
   * 清理重连定时器
   */
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  /**
   * 连接 WebSocket
   */
  const connect = useCallback(() => {
    if (!port) return;

    // 清理现有连接
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus('connecting');

    try {
      const ws = new WebSocket(`ws://${host}:${port}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        setReconnectAttempts(0);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage;
          onMessageRef.current?.(message);
        } catch {
          console.warn('无法解析 WebSocket 消息:', event.data);
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        wsRef.current = null;

        // 自动重连
        if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
          const delay = getReconnectDelay(reconnectAttempts);
          reconnectTimeoutRef.current = window.setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        setStatus('error');
      };
    } catch {
      setStatus('error');
    }
  }, [port, host, autoReconnect, maxReconnectAttempts, reconnectAttempts, getReconnectDelay]);

  /**
   * 断开连接
   */
  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
    setReconnectAttempts(0);
  }, [clearReconnectTimeout]);

  /**
   * 手动重连
   */
  const reconnect = useCallback(() => {
    clearReconnectTimeout();
    setReconnectAttempts(0);
    connect();
  }, [clearReconnectTimeout, connect]);

  /**
   * 发送消息
   */
  const send = useCallback((message: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // 初始连接
  useEffect(() => {
    if (port) {
      connect();
    }

    return () => {
      clearReconnectTimeout();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [port]); // 只在 port 变化时重新连接

  return {
    status,
    send,
    reconnect,
    disconnect,
    reconnectAttempts,
  };
}
