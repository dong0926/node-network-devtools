/**
 * 基础 HTTP 示例
 * 
 * 演示如何使用 node-network-devtools 监听 http 模块的请求
 * 
 * 运行方式：
 *   node --import ../../dist/esm/register.js index.js
 */

import http from 'node:http';

// 创建一个简单的 HTTP 服务器
const server = http.createServer((req, res) => {
  console.log(`收到请求: ${req.method} ${req.url}`);
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'Hello from server!',
    timestamp: Date.now() 
  }));
});

server.listen(3000, () => {
  console.log('服务器启动在 http://localhost:3000');
  console.log('打开 chrome://inspect 查看网络请求\n');
  
  // 发起一些测试请求
  makeRequests();
});

async function makeRequests() {
  console.log('开始发起测试请求...\n');
  
  // 请求 1: GET 请求
  await makeRequest('GET', '/api/users');
  
  // 请求 2: POST 请求
  await makeRequest('POST', '/api/users', { name: 'Alice', age: 25 });
  
  // 请求 3: 外部 API 请求
  await makeExternalRequest();
  
  console.log('\n所有请求完成！查看 Chrome DevTools Network 面板');
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
        'Authorization': 'Bearer test-token-12345',
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
