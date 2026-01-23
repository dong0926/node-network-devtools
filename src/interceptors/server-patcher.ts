import http from 'node:http';
import https from 'node:https';
import { traceManager } from '../context/trace-manager.js';
import { ContextManager } from '../context/context-manager.js';
import { getConfig } from '../config.js';
import { TraceCollector } from './trace-collector.js';
import { TraceAggregator } from '../context/trace-aggregator.js';
import { getEventBridge } from '../gui/event-bridge.js';
import { FastifyAdapter } from '../adapters/fastify.js';
import { ExpressAdapter } from '../adapters/express.js';

let installed = false;

/**
 * 服务端拦截器
 * 负责拦截 http.createServer 并初始化追踪上下文
 */
export const ServerPatcher = {
  install() {
    if (installed) return;
    const config = getConfig();
    if (!config.traceEnabled) return;

    this.patchHttp();
    this.patchHttps();
    TraceCollector.install().catch(err => {
      console.error('[server-patcher] Failed to install TraceCollector:', err);
    });
    FastifyAdapter.install();
    ExpressAdapter.install();
    installed = true;
    console.log('[server-patcher] ✅ Server Trace Interceptor installed');
  },

  patchHttp() {
    const originalCreateServer = http.createServer;
    // @ts-ignore
    http.createServer = function(options: any, requestListener?: any) {
      let finalOptions = options;
      let finalRequestListener = requestListener;

      if (typeof options === 'function') {
        finalRequestListener = options;
        finalOptions = {};
      }

      const wrappedListener = (req: http.IncomingMessage, res: http.ServerResponse) => {
        if (!finalRequestListener) return;

        const requestId = `sreq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const session = traceManager.createSession(requestId, `${req.method} ${req.url}`);
        
        session.rootNode.metadata = {
          headers: req.headers,
          url: req.url,
          method: req.method
        };

        const context = ContextManager.startTrace(requestId, {
          url: req.url,
          method: req.method,
          headers: req.headers,
        });

        const handleFinish = () => {
          try {
            session.rootNode.endTime = Date.now();
            session.rootNode.duration = session.rootNode.endTime - session.rootNode.startTime;
            
            // 聚合与降噪
            const aggregatedTrace = TraceAggregator.aggregate(session);
            
            // 发送到前端
            const eventBridge = getEventBridge();
            if (eventBridge.isRunning()) {
              // 关键修复：确保包含 requestId
              eventBridge.emitServerTrace({
                ...aggregatedTrace,
                requestId: session.requestId
              });
            }
          } catch (e) {
            console.error('[server-trace] Failed to finalize trace:', e);
          }
        };

        // 在追踪会话中运行
        traceManager.run(session, () => {
          ContextManager.runWithContext(context, () => {
            res.on('finish', handleFinish);
            (finalRequestListener as any)(req, res);
          });
        });
      };

      return originalCreateServer.call(http, finalOptions, wrappedListener);
    };
  },

  patchHttps() {
    const originalCreateServer = https.createServer;
    // @ts-ignore
    https.createServer = function(options: any, requestListener?: any) {
      let finalOptions = options;
      let finalRequestListener = requestListener;

      if (typeof options === 'function') {
        finalRequestListener = options;
        finalOptions = {};
      }

      const wrappedListener = (req: http.IncomingMessage, res: http.ServerResponse) => {
        if (!finalRequestListener) return;

        const requestId = `sreq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const session = traceManager.createSession(requestId, `${req.method} ${req.url}`);
        
        session.rootNode.metadata = {
          headers: req.headers,
          url: req.url,
          method: req.method
        };

        const context = ContextManager.startTrace(requestId, {
          url: req.url,
          method: req.method,
          headers: req.headers,
        });

        const handleFinish = () => {
          session.rootNode.endTime = Date.now();
          session.rootNode.duration = session.rootNode.endTime - session.rootNode.startTime;

          // 聚合与降噪
          const aggregatedTrace = TraceAggregator.aggregate(session);
          
          // 发送到前端
          try {
            const eventBridge = getEventBridge();
            if (eventBridge.isRunning()) {
              eventBridge.emitServerTrace({
                ...aggregatedTrace,
                requestId: session.requestId
              });
            }
          } catch (e) {
            // Ignore
          }
        };

        traceManager.run(session, () => {
          ContextManager.runWithContext(context, () => {
            res.on('finish', handleFinish);
            (finalRequestListener as any)(req, res);
          });
        });
      };

      return originalCreateServer.call(https, finalOptions, wrappedListener);
    };
  }
};