import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import http from 'node:http';
import { setConfig } from '../../src/config.js';
import { ServerPatcher } from '../../src/interceptors/server-patcher.js';
import { getEventBridge, resetEventBridge } from '../../src/gui/event-bridge.js';
import { resetWebSocketHub } from '../../src/gui/websocket-hub.js';

describe('Express Server Trace Integration', () => {
  let eventBridge: any;
  let express: any;

  beforeAll(async () => {
    // 强制开启追踪
    setConfig({ traceEnabled: true, guiEnabled: false });
    ServerPatcher.install();
    
    // 动态加载 express，以便 patcher 能够拦截 require
    const expressModule = await import('express');
    express = expressModule.default || expressModule;

    eventBridge = getEventBridge();
    eventBridge.start();
  });

  afterAll(async () => {
    resetEventBridge();
    await resetWebSocketHub();
  });

  it('should capture express route trace', async () => {
    const spy = vi.spyOn(eventBridge, 'emitServerTrace');

    const app = express();
    app.get('/user/:id', (req, res) => {
      // 模拟一些异步操作
      setTimeout(() => {
        res.json({ id: req.params.id, name: 'Test User' });
      }, 50);
    });

    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as any).port;

    await new Promise<void>((resolve) => {
      http.get(`http://localhost:${port}/user/123`, (res) => {
        res.on('data', () => {});
        res.on('end', resolve);
      });
    });

    // 等待异步 trace 聚合和发送
    for (let i = 0; i < 20; i++) {
      if (spy.mock.calls.length > 0) break;
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    expect(spy).toHaveBeenCalled();
    const capturedTrace = spy.mock.calls[0][0];
    
    expect(capturedTrace).toBeDefined();
    // 验证路由信息是否被捕获（通过 ExpressAdapter）
    expect(capturedTrace.name).toBe('GET /user/:id');
    expect(capturedTrace.metadata.framework).toBe('express');
    expect(capturedTrace.metadata.route).toBe('/user/:id');
    
    // 验证层级结构（应该有 JS/Timeout 节点）
    const hasTimeout = (node: any): boolean => {
      if (node.name === 'Timeout') return true;
      return (node.children || []).some(hasTimeout);
    };
    expect(hasTimeout(capturedTrace)).toBe(true);

    server.close();
  });
});
