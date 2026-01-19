/**
 * CommonJS 使用示例
 * 
 * 演示如何在 CommonJS 环境中使用 node-network-devtools
 * 
 * 运行方式：
 * 
 * 方式 1: 使用 require 手动导入
 *   node index.js
 * 
 * 方式 2: 使用 -r 标志自动注册
 *   node -r ../../dist/cjs/register.js index.js
 * 
 * 或使用 npm scripts:
 *   pnpm start              # 手动导入方式
 *   pnpm start:register     # 自动注册方式
 */

const http = require('http');

// 方式 1: 手动导入并配置
const { getRequestStore, patchHttp, patchUndici } = require('@mt0926/node-network-devtools');

console.log('=== CommonJS 使用示例 ===\n');

// 手动启用拦截器
patchHttp();
patchUndici();

console.log('✓ HTTP 拦截器已启用');
console.log('✓ Undici/Fetch 拦截器已启用\n');

// 创建一个简单的 HTTP 服务器
const server = http.createServer((req, res) => {
  console.log(`收到请求: ${req.method} ${req.url}`);
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'Hello from CommonJS server!',
    timestamp: Date.now(),
    moduleSystem: 'CommonJS'
  }));
});

server.listen(3000, () => {
  console.log('服务器启动在 http://localhost:3000');
  console.log('GUI 界面会自动打开，显示网络请求\n');
  
  // 发起一些测试请求
  makeRequests();
});

async function makeRequests() {
  console.log('开始发起测试请求...\n');
  
  // 等待服务器完全启动
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 请求 1: GET 请求
  await makeRequest('GET', '/api/users');
  
  // 请求 2: POST 请求
  await makeRequest('POST', '/api/users', { 
    name: 'Bob', 
    age: 30,
    source: 'CommonJS Example'
  });
  
  // 请求 3: PUT 请求
  await makeRequest('PUT', '/api/users/1', { 
    name: 'Bob Updated',
    age: 31
  });
  
  // 请求 4: DELETE 请求
  await makeRequest('DELETE', '/api/users/1');
  
  // 请求 5: 外部 API 请求
  await makeExternalRequest();
  
  console.log('\n所有请求完成！');
  console.log('查看 GUI 界面或 Chrome DevTools Network 面板');
  
  // 显示请求存储统计
  showRequestStats();
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CommonJS-Example/1.0',
        'Authorization': 'Bearer commonjs-token-67890',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✓ ${method} ${path} -> ${res.statusCode}`);
        resolve(data);
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function makeExternalRequest() {
  return new Promise((resolve, reject) => {
    const req = http.request('http://httpbin.org/get', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✓ GET httpbin.org/get -> ${res.statusCode}`);
        resolve(data);
      });
    });

    req.on('error', (err) => {
      console.log(`✗ GET httpbin.org/get -> ${err.message}`);
      resolve(null);
    });
    
    req.end();
  });
}

function showRequestStats() {
  const store = getRequestStore();
  const requests = store.getAll();
  
  console.log('\n=== 请求统计 ===');
  console.log(`总请求数: ${requests.length}`);
  console.log(`成功请求: ${requests.filter(r => r.response?.statusCode >= 200 && r.response?.statusCode < 300).length}`);
  console.log(`失败请求: ${requests.filter(r => r.error).length}`);
  
  console.log('\n请求列表:');
  requests.forEach((req, index) => {
    const status = req.response?.statusCode || 'pending';
    const method = req.method || 'GET';
    const url = req.url || 'unknown';
    console.log(`  ${index + 1}. [${status}] ${method} ${url}`);
  });
}

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n\n正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
