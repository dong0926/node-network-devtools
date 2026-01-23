import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import http from 'node:http';
import { getConfig, setConfig } from '../../src/config.js';
import { ServerPatcher } from '../../src/interceptors/server-patcher.js';
import { getEventBridge, resetEventBridge } from '../../src/gui/event-bridge.js';
import { resetWebSocketHub } from '../../src/gui/websocket-hub.js';

describe('Server Trace Integration', () => {
  let eventBridge: any;

  beforeAll(() => {
    // 强制开启追踪
    setConfig({ traceEnabled: true, guiEnabled: false });
    ServerPatcher.install();
    eventBridge = getEventBridge();
    eventBridge.start();
  });

  afterAll(async () => {
    resetEventBridge();
    await resetWebSocketHub();
  });

  it('should capture a simple http request trace', async () => {
    const spy = vi.spyOn(eventBridge, 'emitServerTrace');

    const server = http.createServer((req, res) => {
      res.end('ok');
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as any).port;

    await new Promise<void>((resolve) => {
      http.get(`http://localhost:${port}`, (res) => {
        res.on('data', () => {});
        res.on('end', resolve);
      });
    });

    // 等待异步 trace 聚合和发送
    // 我们轮询 spy 直到它被调用或超时
    for (let i = 0; i < 20; i++) {
      if (spy.mock.calls.length > 0) break;
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    expect(spy).toHaveBeenCalled();
    const capturedTrace = spy.mock.calls[0][0];
    
    expect(capturedTrace).toBeDefined();
    expect(capturedTrace.name).toContain('GET /');
    expect(capturedTrace.type).toBe('ROOT');
    expect(capturedTrace.duration).toBeGreaterThanOrEqual(0);

    server.close();
  });
});
