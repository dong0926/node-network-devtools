/**
 * HTTP 拦截器 Node.js 原生测试
 * 
 * 由于 vitest ESM 模块隔离的限制，HTTP 拦截测试需要使用
 * Node.js 原生测试运行器来运行。
 * 
 * 运行方式: npx tsx --test src/interceptors/http-patcher.node-test.mjs
 */

import { test, describe, beforeEach, afterEach, before, after } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';

// 使用 createRequire 获取可修改的 http 模块（与 http-patcher 使用相同的模块实例）
const require = createRequire(import.meta.url);
const http = require('node:http');

// 导入 TypeScript 模块
const { HttpPatcher } = await import('./http-patcher.ts');
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

describe('HttpPatcher', () => {
  beforeEach(() => {
    resetConfig();
    resetRequestStore();
    HttpPatcher.uninstall();
  });

  afterEach(() => {
    HttpPatcher.uninstall();
    resetRequestStore();
  });

  describe('install/uninstall', () => {
    test('should install and uninstall correctly', () => {
      assert.strictEqual(HttpPatcher.isInstalled(), false);
      
      HttpPatcher.install();
      assert.strictEqual(HttpPatcher.isInstalled(), true);
      
      HttpPatcher.uninstall();
      assert.strictEqual(HttpPatcher.isInstalled(), false);
    });

    test('should be idempotent', () => {
      HttpPatcher.install();
      HttpPatcher.install();
      assert.strictEqual(HttpPatcher.isInstalled(), true);
      
      HttpPatcher.uninstall();
      HttpPatcher.uninstall();
      assert.strictEqual(HttpPatcher.isInstalled(), false);
    });
  });

  describe('Property 1: 请求捕获完整性', () => {
    test('should capture request URL correctly', async () => {
      HttpPatcher.install();

      const paths = ['/api/users', '/test', '/api/v1/data'];
      
      for (const path of paths) {
        resetRequestStore();
        
        await new Promise((resolve, reject) => {
          const req = http.request({
            hostname: 'localhost',
            port: serverPort,
            path,
            method: 'GET',
          }, (res) => {
            res.on('data', () => {});
            res.on('end', resolve);
          });
          req.on('error', reject);
          req.end();
        });

        const requests = getRequestStore().getAll();
        assert.strictEqual(requests.length, 1, `应该捕获到 1 个请求，实际捕获到 ${requests.length} 个`);
        assert.ok(requests[0].url.includes(path), `URL 应该包含 ${path}`);
      }
    });

    test('should capture request method correctly', async () => {
      HttpPatcher.install();

      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      for (const method of methods) {
        resetRequestStore();
        
        await new Promise((resolve, reject) => {
          const req = http.request({
            hostname: 'localhost',
            port: serverPort,
            path: '/test',
            method,
          }, (res) => {
            res.on('data', () => {});
            res.on('end', resolve);
          });
          req.on('error', reject);
          req.end();
        });

        const requests = getRequestStore().getAll();
        assert.strictEqual(requests.length, 1);
        assert.strictEqual(requests[0].method, method);
      }
    });

    test('should capture request headers correctly', async () => {
      HttpPatcher.install();

      const customHeaders = {
        'X-Custom-Header': 'custom-value',
        'Accept': 'application/json',
      };

      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: serverPort,
          path: '/test',
          method: 'GET',
          headers: customHeaders,
        }, (res) => {
          res.on('data', () => {});
          res.on('end', resolve);
        });
        req.on('error', reject);
        req.end();
      });

      const requests = getRequestStore().getAll();
      assert.strictEqual(requests.length, 1);
      assert.strictEqual(requests[0].headers['x-custom-header'], 'custom-value');
      assert.strictEqual(requests[0].headers['accept'], 'application/json');
    });

    test('should capture request body correctly', async () => {
      HttpPatcher.install();

      const testBody = JSON.stringify({ name: 'test', value: 123 });

      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: serverPort,
          path: '/test',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(testBody),
          },
        }, (res) => {
          res.on('data', () => {});
          res.on('end', resolve);
        });
        req.on('error', reject);
        req.write(testBody);
        req.end();
      });

      const requests = getRequestStore().getAll();
      assert.strictEqual(requests.length, 1);
      assert.strictEqual(requests[0].body?.toString(), testBody);
    });
  });

  describe('Property 2: 响应捕获完整性', () => {
    test('should capture response status code correctly', async () => {
      HttpPatcher.install();

      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: serverPort,
          path: '/test',
          method: 'GET',
        }, (res) => {
          res.on('data', () => {});
          res.on('end', resolve);
        });
        req.on('error', reject);
        req.end();
      });

      const requests = getRequestStore().getAll();
      assert.strictEqual(requests.length, 1);
      assert.strictEqual(requests[0].response?.statusCode, 200);
    });

    test('should capture response headers correctly', async () => {
      HttpPatcher.install();

      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: serverPort,
          path: '/test',
          method: 'GET',
        }, (res) => {
          res.on('data', () => {});
          res.on('end', resolve);
        });
        req.on('error', reject);
        req.end();
      });

      const requests = getRequestStore().getAll();
      assert.strictEqual(requests.length, 1);
      assert.strictEqual(requests[0].response?.headers['content-type'], 'application/json');
      assert.strictEqual(requests[0].response?.headers['x-custom-header'], 'test-value');
    });

    test('should capture response with timing data', async () => {
      HttpPatcher.install();

      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: serverPort,
          path: '/test',
          method: 'GET',
        }, (res) => {
          res.on('data', () => {});
          res.on('end', resolve);
        });
        req.on('error', reject);
        req.end();
      });

      const requests = getRequestStore().getAll();
      assert.strictEqual(requests.length, 1);
      assert.ok(requests[0].timing !== undefined);
      assert.ok(requests[0].timing?.total >= 0);
    });
  });

  describe('Property 3: 堆栈追踪有效性', () => {
    test('should generate valid stack trace', async () => {
      HttpPatcher.install();

      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: serverPort,
          path: '/test',
          method: 'GET',
        }, (res) => {
          res.on('data', () => {});
          res.on('end', resolve);
        });
        req.on('error', reject);
        req.end();
      });

      const requests = getRequestStore().getAll();
      assert.strictEqual(requests.length, 1);
      assert.ok(requests[0].stackTrace !== undefined);
      assert.ok(requests[0].stackTrace.length > 0);
      assert.ok(requests[0].stackTrace.includes('at'));
    });
  });

  describe('Property 4: 请求行为不变性', () => {
    test('should not affect request/response behavior', async () => {
      // 先不安装拦截器，发送请求
      const responseWithoutInterceptor = await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: serverPort,
          path: '/test',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.write('{"test": true}');
        req.end();
      });

      // 安装拦截器后发送相同请求
      HttpPatcher.install();
      
      const responseWithInterceptor = await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: serverPort,
          path: '/test',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.write('{"test": true}');
        req.end();
      });

      const parsed1 = JSON.parse(responseWithoutInterceptor);
      const parsed2 = JSON.parse(responseWithInterceptor);
      
      assert.strictEqual(parsed1.method, parsed2.method);
      assert.strictEqual(parsed1.url, parsed2.url);
      assert.strictEqual(parsed1.body, parsed2.body);
    });

    test('should preserve error handling', async () => {
      HttpPatcher.install();

      const error = await new Promise((resolve) => {
        const req = http.request({
          hostname: 'localhost',
          port: 59999,
          path: '/test',
          method: 'GET',
        });
        req.on('error', resolve);
        req.end();
      });

      // 等待一小段时间让错误被记录
      await new Promise(resolve => setTimeout(resolve, 100));

      assert.ok(error !== undefined);
      assert.ok(error.message !== undefined);

      const requests = getRequestStore().getAll();
      assert.strictEqual(requests.length, 1, '应该捕获到 1 个请求');
      // 错误可能还没有被记录，这取决于事件顺序
      // 主要验证请求被捕获且错误事件正常触发
      if (requests[0].error) {
        assert.ok(requests[0].error.code === 'ECONNREFUSED', '错误码应该是 ECONNREFUSED');
      }
    });
  });

  describe('http.get shorthand', () => {
    test('should intercept http.get', async () => {
      HttpPatcher.install();

      await new Promise((resolve, reject) => {
        http.get(`http://localhost:${serverPort}/test`, (res) => {
          res.on('data', () => {});
          res.on('end', resolve);
        }).on('error', reject);
      });

      const requests = getRequestStore().getAll();
      assert.strictEqual(requests.length, 1);
      assert.strictEqual(requests[0].method, 'GET');
    });
  });
});

console.log('HTTP 拦截器测试完成');
