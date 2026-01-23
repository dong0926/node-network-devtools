/**
 * 编程化使用示例 - 无需 node -r 即可运行
 * 
 * 使用说明:
 * 1. 确保已运行过 pnpm build
 * 2. 直接运行: node examples/test-programmatic.js
 */

const path = require('path');
const fs = require('fs').promises;
const http = require('http');

// 1. 引入工具 (指向本地构建的 cjs 版本)
// 在实际项目中，这里是 require('@mt0926/node-network-devtools')
const nnd = require('../dist/cjs/index.js');

// 2. 编程化配置
// 这些配置也可以通过环境变量设置，但编程化设置优先级更高
nnd.setConfig({
  traceEnabled: true,       // 开启服务端追踪 (Server Trace)
  guiEnabled: true,         // 开启 GUI 服务器
  autoOpen: true,           // 自动打开浏览器
  traceThresholdMs: 0,      // 记录所有节点，不进行降噪折叠
  interceptHttp: true,      // 拦截传出的 HTTP 请求 (Network)
});

// 3. 重要：手动触发初始化
// 在 node -r 模式下这是自动的，但在编程化模式下我们需要手动调用或确保拦截器安装
// 这里我们模拟 register.ts 的行为
const { ServerPatcher } = require('../dist/cjs/interceptors/server-patcher.js');
const { HttpPatcher } = require('../dist/cjs/interceptors/http-patcher.js');
const { getGUIServer } = require('../dist/cjs/gui/server.js');
const { getEventBridge } = require('../dist/cjs/gui/event-bridge.js');

async function start() {
  // 安装拦截器
  HttpPatcher.install();
  ServerPatcher.install();
  
  // 启动 GUI
  const gui = getGUIServer();
  const { url } = await gui.start({ guiPort: 'auto', wsPort: 'auto' });
  getEventBridge().start();
  
  console.log(`[NND] GUI 已启动: ${url}`);

  // 显式打开浏览器
  const { openBrowser } = require('../dist/cjs/gui/browser-launcher.js');
  try {
    await openBrowser(url);
    console.log(`[NND] 浏览器已自动打开`);
  } catch (e) {
    console.log(`[NND] 自动打开浏览器失败，请手动访问: ${url}`);
  }

  // 4. 之后引入业务框架
  const express = require('express');
  const app = express();
  const port = 3005;

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // 具名函数测试
  async function performDiskOperations() {
    await fs.writeFile('trace-test.log', 'test');
    await sleep(200); // 增加延时
    await fs.readFile('trace-test.log');
    await fs.unlink('trace-test.log');
  }

  async function fetchExternalData() {
    return new Promise(resolve => {
      http.get('http://www.baidu.com', (r) => {
        r.on('data', () => {});
        r.on('end', resolve);
      }).on('error', resolve);
    });
  }

  app.get('/test', async (req, res) => {
    console.log('收到请求: /test');
    
    // 调用具名函数
    await performDiskOperations();

    // 匿名延时
    await new Promise(resolve => setTimeout(resolve, 50));

    // 调用另一个具名函数
    await fetchExternalData();

    res.json({ message: 'Trace data sent to GUI', view: 'Check TRACES tab' });
  });

  app.listen(port, () => {
    console.log(`\n🚀 业务服务器运行在: http://localhost:${port}/test`);
    console.log(`💡 请在打开的浏览器窗口中切换到 "TRACES" 视图查看结果\n`);
  });
}

start().catch(console.error);