/**
 * 测试服务端全链路追踪
 */

const express = require('express');
const fs = require('fs').promises;
const http = require('http');
const path = require('path');

const app = express();
const port = 3000;

app.get('/', async (req, res) => {
  console.log('收到请求: /');
  
  // 1. 模拟文件系统操作
  await fs.writeFile(path.join(__dirname, 'test.tmp'), 'hello');
  const content = await fs.readFile(path.join(__dirname, 'test.tmp'), 'utf-8');
  await fs.unlink(path.join(__dirname, 'test.tmp'));

  // 2. 模拟异步 Promise 链
  await new Promise(resolve => setTimeout(resolve, 50));
  await Promise.resolve().then(() => {
    return new Promise(resolve => setTimeout(resolve, 30));
  });

  // 3. 模拟传出的 HTTP 请求 (如果开启了拦截)
  try {
    await new Promise((resolve, reject) => {
      http.get('http://www.google.com', (hres) => {
        hres.on('data', () => {});
        hres.on('end', resolve);
      }).on('error', resolve); // 忽略错误，只为产生 trace
    });
  } catch (e) {
    // Ignore
  }

  res.json({
    status: 'ok',
    content,
    message: 'Trace should be captured'
  });
});

app.listen(port, () => {
  console.log(`测试服务器运行在 http://localhost:${port}`);
  console.log('请确保已通过 node -r ./register.js 或 NND_TRACE_ENABLED=true 启动');
});
