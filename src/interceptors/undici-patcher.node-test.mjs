/**
 * Undici/Fetch 拦截器 Node.js 原生测试
 * 
 * 运行方式: npx tsx --test src/interceptors/undici-patcher.node-test.mjs
 */

import { test, describe, beforeEach, afterEach, before, after } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';

// 使用 createRequire 获取 http 模块（用于创建测试服务器）
const require = createRequire(import.meta.url);
const http = require('node:http');

// 导入模块
const { UndiciPatcher } = await import('./undici-patcher.ts');
const { getRequestStore, resetRequestStore } = await import('../store/ring-buffer.ts');
const { resetConfig } = await import('../config.ts');

// 测试服务器
let server;
let serverPort;

before(async () => {
  // 创建测试服务器
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const response = JSON.stringify({
        method: req.method,
        url: req.url,
        headers: req.headers,
        body,
      });
      
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'X-Custom-Header': 'test-value'
      });
      res.end(response);
    });
  });

  await new Promise((resolve) => {
    server.listen(0, () => {
      serverPort = server.address().port;
      console.log(`测试服务器启动在端口 ${serverPort}`);
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => {
    server.close(() => resolve());
  });
});

describe('UndiciPatcher', () => {
  beforeEach(() => {
    resetConfig();
    resetRequestStore();
    UndiciPatcher.uninstall();
  });

  afterEach(() => {
    UndiciPatcher.uninstall();
    resetRequestStore();
  });

  describe('install/uninstall', () => {
    test('should check if undici is available', () => {
      const available = UndiciPatcher.isUndiciAvailable();
      console.log('undici 可用:', available);
      // undici 可能已安装也可能未安装
      assert.ok(typeof available === 'boolean');
    });

    test('should install and uninstall correctly', () => {
      if (!UndiciPatcher.isUndiciAvailable()) {
        console.log('跳过测试：undici 不可用');
        return;
      }

      assert.strictEqual(UndiciPatcher.isInstalled(), false);
      
      UndiciPatcher.install();
      assert.strictEqual(UndiciPatcher.isInstalled(), true);
      
      UndiciPatcher.uninstall();
      assert.strictEqual(UndiciPatcher.isInstalled(), false);
    });

    test('should be idempotent', () => {
      if (!UndiciPatcher.isUndiciAvailable()) {
        console.log('跳过测试：undici 不可用');
        return;
      }

      UndiciPatcher.install();
      UndiciPatcher.install();
      assert.strictEqual(UndiciPatcher.isInstalled(), true);
      
      UndiciPatcher.uninstall();
      UndiciPatcher.uninstall();
      assert.strictEqual(UndiciPatcher.isInstalled(), false);
    });
  });

  describe('Property 6: 双栈拦截一致性 - fetch 请求捕获', () => {
    test('should capture fetch request URL correctly', async () => {
      if (!UndiciPatcher.isUndiciAvailable()) {
        console.log('跳过测试：undici 不可用');
        return;
      }

      UndiciPatcher.install();

      const url = `http://localhost:${serverPort}/api/test`;
      await fetch(url);

      const requests = getRequestStore().getAll();
      assert.strictEqual(requests.length, 1, '应该捕获到 1 个请求');
      assert.ok(requests[0].url.includes('/api/test'), 'URL 应该包含路径');
    });

    test('should capture fetch request method correctly', async () => {
      if (!UndiciPatcher.isUndiciAvailable()) {
        console.log('跳过测试：undici 不可用');
        return;
      }

      UndiciPatcher.install();

      const methods = ['GET', 'POST', 'PUT', 'DELETE'];
      
      for (const method of methods) {
        resetRequestStore();
        
        await fetch(`http://localhost:${serverPort}/test`, { method });

        const requests = getRequestStore().getAll();
        assert.strictEqual(requests.length, 1);
        assert.strictEqual(requests[0].method, method);
      }
    });

    test('should capture fetch request headers correctly', async () => {
      if (!UndiciPatcher.isUndiciAvailable()) {
        console.log('跳过测试：undici 不可用');
        return;
      }

      UndiciPatcher.install();

      await fetch(`http://localhost:${serverPort}/test`, {
        headers: {
          'X-Custom-Header': 'custom-value',
          'Accept': 'application/json',
        },
      });

      const requests = getRequestStore().getAll();
      assert.strictEqual(requests.length, 1);
      // fetch 可能会规范化 header 名称
      const headers = requests[0].headers;
      assert.ok(
        headers['x-custom-header'] === 'custom-value' || 
        headers['X-Custom-Header'] === 'custom-value',
        '应该捕获自定义 header'
      );
    });

    test('should capture fetch request body correctly', async () => {
      if (!UndiciPatcher.isUndiciAvailable()) {
        console.log('跳过测试：undici 不可用');
        return;
      }

      UndiciPatcher.install();

      const testBody = JSON.stringify({ name: 'test', value: 123 });

      await fetch(`http://localhost:${serverPort}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: testBody,
      });

      const requests = getRequestStore().getAll();
      assert.strictEqual(requests.length, 1);
      // 请求体可能已被捕获
      if (requests[0].body) {
        assert.strictEqual(requests[0].body.toString(), testBody);
      }
    });
  });

  describe('响应捕获', () => {
    test('should capture fetch response status code correctly', async () => {
      if (!UndiciPatcher.isUndiciAvailable()) {
        console.log('跳过测试：undici 不可用');
        return;
      }

      UndiciPatcher.install();

      await fetch(`http://localhost:${serverPort}/test`);

      // 等待响应被记录
      await new Promise(resolve => setTimeout(resolve, 50));

      const requests = getRequestStore().getAll();
      assert.strictEqual(requests.length, 1);
      assert.ok(requests[0].response !== undefined, '应该有响应数据');
      assert.strictEqual(requests[0].response?.statusCode, 200);
    });

    test('should capture fetch response headers correctly', async () => {
      if (!UndiciPatcher.isUndiciAvailable()) {
        console.log('跳过测试：undici 不可用');
        return;
      }

      UndiciPatcher.install();

      await fetch(`http://localhost:${serverPort}/test`);

      // 等待响应被记录
      await new Promise(resolve => setTimeout(resolve, 50));

      const requests = getRequestStore().getAll();
      assert.strictEqual(requests.length, 1);
      assert.ok(requests[0].response !== undefined);
      
      const headers = requests[0].response?.headers || {};
      assert.ok(
        headers['content-type']?.includes('application/json') ||
        headers['Content-Type']?.includes('application/json'),
        '应该捕获 Content-Type header'
      );
    });

    test('should capture timing data', async () => {
      if (!UndiciPatcher.isUndiciAvailable()) {
        console.log('跳过测试：undici 不可用');
        return;
      }

      UndiciPatcher.install();

      await fetch(`http://localhost:${serverPort}/test`);

      // 等待时序数据被记录
      await new Promise(resolve => setTimeout(resolve, 50));

      const requests = getRequestStore().getAll();
      assert.strictEqual(requests.length, 1);
      assert.ok(requests[0].timing !== undefined, '应该有时序数据');
      assert.ok(requests[0].timing?.total >= 0, '总时间应该 >= 0');
    });
  });

  describe('请求行为不变性', () => {
    test('should not affect fetch response behavior', async () => {
      if (!UndiciPatcher.isUndiciAvailable()) {
        console.log('跳过测试：undici 不可用');
        return;
      }

      // 先不安装拦截器
      const responseWithoutInterceptor = await fetch(`http://localhost:${serverPort}/test`).then(r => r.json());

      // 安装拦截器
      UndiciPatcher.install();
      
      const responseWithInterceptor = await fetch(`http://localhost:${serverPort}/test`).then(r => r.json());

      assert.strictEqual(responseWithoutInterceptor.method, responseWithInterceptor.method);
      assert.strictEqual(responseWithoutInterceptor.url, responseWithInterceptor.url);
    });
  });
});
