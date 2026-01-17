/**
 * Express 服务器示例
 * 
 * 演示在 Express 应用中使用 node-network-devtools
 * 监听服务器发出的外部 API 请求
 * 
 * 运行方式：
 *   npx node-network-devtools index.js
 */

import http from 'node:http';

// 简单的路由处理（模拟 Express 风格）
const routes = {
  'GET /': handleHome,
  'GET /api/weather': handleWeather,
  'GET /api/github': handleGithub,
  'POST /api/webhook': handleWebhook,
};

async function handleHome(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <h1>Node Network DevTools Demo</h1>
    <ul>
      <li><a href="/api/weather">获取天气</a></li>
      <li><a href="/api/github">获取 GitHub 信息</a></li>
    </ul>
    <p>打开 chrome://inspect 查看网络请求</p>
  `);
}

async function handleWeather(req, res) {
  console.log('处理天气请求...');
  
  // 调用外部天气 API（使用 httpbin 模拟）
  const response = await fetch('https://httpbin.org/json');
  const data = await response.json();
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    source: 'weather-api',
    data: data.slideshow 
  }));
}

async function handleGithub(req, res) {
  console.log('处理 GitHub 请求...');
  
  // 调用 GitHub API
  const response = await fetch('https://api.github.com/users/nodejs', {
    headers: { 'User-Agent': 'node-network-devtools-demo' }
  });
  const user = await response.json();
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    name: user.name,
    followers: user.followers,
    repos: user.public_repos,
  }));
}


async function handleWebhook(req, res) {
  console.log('处理 Webhook...');
  
  // 转发到另一个服务
  const response = await fetch('https://httpbin.org/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'webhook', timestamp: Date.now() }),
  });
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ forwarded: true }));
}

function handleNotFound(req, res) {
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
}

// 创建服务器
const server = http.createServer(async (req, res) => {
  const key = `${req.method} ${req.url.split('?')[0]}`;
  const handler = routes[key];
  
  try {
    if (handler) {
      await handler(req, res);
    } else {
      handleNotFound(req, res);
    }
  } catch (error) {
    console.error('请求处理错误:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(3000, () => {
  console.log('Express 风格服务器启动在 http://localhost:3000');
  console.log('打开 chrome://inspect 查看网络请求\n');
  console.log('可用路由:');
  console.log('  GET  /           - 首页');
  console.log('  GET  /api/weather - 获取天气（调用外部 API）');
  console.log('  GET  /api/github  - 获取 GitHub 信息');
  console.log('  POST /api/webhook - Webhook 转发');
});
