<div align="center">

# 🔍 Node Network DevTools

**Node.js 强大的零配置网络调试助手。**  
*实时监控所有 HTTP、HTTPS 和 Fetch/Undici 请求，提供类似 Chrome DevTools 的极简 Web GUI 体验。*

[![npm version](https://img.shields.io/npm/v/@mt0926/node-network-devtools.svg)](https://www.npmjs.com/package/@mt0926/node-network-devtools)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](./README.md) | [中文文档](#)

</div>

---

## 🚀 为什么选择 Node Network DevTools?

还在用 `console.log` 打印每一个请求和响应吗？**Node Network DevTools** 将浏览器“网络”面板的熟悉体验带到了 Node.js 后端。无论是在调试外部 API 调用、微服务还是 Next.js Server Actions，你都可以实时查看每一个细节。

## ✨ 特性

- 💎 **类似 DevTools 的体验** - 熟悉的响应式 Web GUI，用于检查 Header、Payload 和 Response。
- 🔌 **全能拦截** - 原生支持 `http/https` 模块以及现代的 `fetch/undici` (Node.js 18+)。
- 🛠️ **零侵入开发** - 只需一行代码或一个简单的 CLI 标志即可接入项目。
- 🖥️ **极简浏览器窗口** - 自动启动基于系统原生浏览器 (Chrome, Edge, 或 Chromium) 的紧凑 App 模式窗口。
- 🔍 **服务端追踪 (新!)** - 可视化 Node.js 服务内部的执行流程（异步调用树/火焰图）。
- 🔗 **智能请求追踪** - 利用 `AsyncLocalStorage` 自动关联同一业务流中的多个异步请求。
- 🛡️ **内置脱敏** - 自动隐藏 `Authorization` 和 `Cookie` 等敏感信息，保障安全。
- ⚡ **框架友好** - 无缝集成 Next.js, Express, Fastify 等主流框架。
- 📦 **双模块支持** - 完美兼容 **ESM** 和 **CommonJS**。

## 📸 截图

### Web GUI 界面
![Web GUI](https://via.placeholder.com/800x450?text=Web+GUI+Screenshot)

## 🚀 快速开始

### 1. 安装

```bash
npm install @mt0926/node-network-devtools
# 或
pnpm add @mt0926/node-network-devtools
```

> **注意**: 无需安装 Puppeteer 等额外依赖！工具会自动检测并使用系统中已有的浏览器。

### 2. 使用方式 (推荐)

在应用入口文件的最顶部调用 `install()`。

**ESM:**
```typescript
import { install } from '@mt0926/node-network-devtools';

await install(); // 确保在发送任何网络请求的 import 之前调用
```

**CommonJS:**
```javascript
const { install } = require('@mt0926/node-network-devtools');

(async () => {
  await install();
})();
```

### 3. 高级方案：零代码注入

如果你不想修改源代码，可以使用 Node.js 的命令行参数来注入工具。

**ESM:**
```bash
node --import @mt0926/node-network-devtools/register your-script.js
```

**CommonJS:**
```bash
node -r @mt0926/node-network-devtools/register your-script.js
```

## 🖥️ Web GUI

启动后，一个极简的浏览器窗口会自动打开并显示实时请求列表。

- **紧凑尺寸** (800x600)，方便分屏调试。
- **搜索与过滤** - 按 URL、方法或状态码筛选。
- **详情面板** - 查看 Header、Payload 和 Response。
- **深色/浅色模式**支持。

如果需要手动访问，请在控制台输出中查找 URL：
`🚀 Node Network DevTools GUI started at http://localhost:9229`


### GUI 配置

```bash
# 自定义窗口大小
NND_BROWSER_WIDTH=1024 NND_BROWSER_HEIGHT=768 node --import @mt0926/node-network-devtools/register your-script.js

# 自定义窗口标题
NND_BROWSER_TITLE="我的应用网络监控" node --import @mt0926/node-network-devtools/register your-script.js

# 指定 GUI 端口
NND_GUI_PORT=9230 node --import @mt0926/node-network-devtools/register your-script.js

# 指定 WebSocket 端口
NND_WS_PORT=9231 node --import @mt0926/node-network-devtools/register your-script.js

# 禁用 GUI
NND_GUI_ENABLED=false node --import @mt0926/node-network-devtools/register your-script.js

# 禁用自动打开浏览器
NND_AUTO_OPEN=false node --import @mt0926/node-network-devtools/register your-script.js
```

## 🔧 配置

### 环境变量

#### 核心设置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NND_MAX_REQUESTS` | 最大存储请求数 | 1000 |
| `NND_MAX_BODY_SIZE` | 最大 body 大小（字节） | 1048576 (1MB) |
| `NND_INTERCEPT_HTTP` | 拦截 http/https | true |
| `NND_INTERCEPT_UNDICI` | 拦截 undici/fetch | true |
| `NND_REDACT_HEADERS` | 要脱敏的头（逗号分隔） | authorization,cookie |

#### GUI 设置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NND_GUI_ENABLED` | 启用 GUI 服务器 | true |
| `NND_GUI_PORT` | GUI 服务器端口 | 自动 |
| `NND_WS_PORT` | WebSocket 端口 | 自动 |
| `NND_AUTO_OPEN` | 自动打开浏览器 | true |
| `NND_BROWSER_WIDTH` | 浏览器窗口宽度 | 800 |
| `NND_BROWSER_HEIGHT` | 浏览器窗口高度 | 600 |
| `NND_BROWSER_TITLE` | 浏览器窗口标题 | Node Network DevTools |

#### 服务端追踪设置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NND_TRACE_ENABLED` | 开启服务端执行追踪 | false |
| `NND_TRACE_MAX_NODES` | 每个请求的最大追踪节点数 | 5000 |
| `NND_TRACE_THRESHOLD_MS` | 异步节点自动折叠阈值（毫秒） | 2 |
| `NND_TRACE_IGNORED_MODULES` | 堆栈捕获中忽略的模块 | node_modules,node: |

### 编程配置

```typescript
import { setConfig } from '@mt0926/node-network-devtools';

setConfig({
  maxRequests: 500,
  maxBodySize: 512 * 1024,
  redactHeaders: ['authorization', 'cookie', 'x-api-key'],
  guiEnabled: true,
  autoOpen: false,
  browserWindowSize: { width: 1024, height: 768 },
  browserWindowTitle: '我的应用网络监控',
});
```

### 在生产环境中禁用

**重要**：始终在生产环境中禁用此工具！

```typescript
// 根据环境条件安装
if (process.env.NODE_ENV === 'development') {
  const { install } = await import('@mt0926/node-network-devtools');
  await install();
}
```

或使用环境变量：

```bash
# 在生产环境中，禁用 GUI 和自动打开
NODE_ENV=production NND_GUI_ENABLED=false NND_AUTO_OPEN=false node your-app.js
```

## 🎯 框架集成

### Next.js

1. 复制 `templates/instrumentation.ts` 到项目根目录
2. 在 `next.config.js` 中启用 instrumentation：

```javascript
module.exports = {
  experimental: {
    instrumentationHook: true,
  },
};
```

3. 启动开发服务器：

```bash
npm run dev
```

或在 `package.json` 中配置：

```json
{
  "scripts": {
    "dev": "next dev"
  }
}
```

**注意**：当 Next.js 加载 instrumentation hook 时，工具会自动启动。

### Express

```typescript
import express from 'express';
import { install } from '@mt0926/node-network-devtools';

await install();

const app = express();
// 你的路由...
```

### 其他框架

适用于任何 Node.js 框架！只需在应用代码之前安装拦截器即可。

## 📚 API 参考

### 主要导出

```typescript
// 快速安装
import { install, startGUI, stopGUI } from '@mt0926/node-network-devtools';

// 配置
import { getConfig, setConfig, resetConfig } from '@mt0926/node-network-devtools';

// 请求存储
import { getRequestStore } from '@mt0926/node-network-devtools';

// 上下文追踪
import { 
  runWithTrace, 
  getCurrentTraceId,
  generateTraceId 
} from '@mt0926/node-network-devtools';

// 拦截器
import { HttpPatcher, UndiciPatcher } from '@mt0926/node-network-devtools';
```

### 请求追踪

关联同一业务流程中的多个请求：

```typescript
import { runWithTrace, getRequestStore } from '@mt0926/node-network-devtools';

await runWithTrace('user-login', async () => {
  // 这些请求会被关联到同一个 traceId
  await fetch('https://api.example.com/auth');
  await fetch('https://api.example.com/user');
});

// 查询关联的请求
const store = getRequestStore();
const requests = store.getByTraceId('user-login');
```

## 📖 示例

查看 [examples](./examples) 目录获取更多使用示例：

- [basic-http](./examples/basic-http) - 基础 HTTP 请求监听
- [fetch-api](./examples/fetch-api) - Fetch API 监听
- [request-tracing](./examples/request-tracing) - 请求追踪
- [express-server](./examples/express-server) - Express 服务器示例
- [programmatic-api](./examples/programmatic-api) - 编程式 API 使用
- [nextjs-app](./examples/nextjs-app) - Next.js App Router 集成

## 🔬 工作原理

1. **HTTP 拦截**：使用 `@mswjs/interceptors` 拦截 http/https 模块请求
2. **Undici 拦截**：使用 `Agent.compose()` 注册拦截器捕获 fetch 请求
3. **上下文传递**：使用 `AsyncLocalStorage` 在异步调用链中传递 TraceID
4. **事件桥接**：将拦截的请求转发到 WebSocket 客户端以实现 GUI 实时更新
5. **原生浏览器启动**：自动检测并启动系统中的浏览器 (Chrome/Edge/Chromium)，并以专用的 App 模式窗口运行。

## 🤝 贡献

欢迎贡献！请阅读我们的[贡献指南](./CONTRIBUTING.md)了解详情。

### 开发设置

```bash
# 克隆仓库
git clone https://github.com/dong0926/node-network-devtools.git
cd node-network-devtools

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 运行测试
pnpm test:all
```

## 📝 许可证

MIT © [ddddd](https://github.com/dong0926)

## 🙏 致谢

- [@mswjs/interceptors](https://github.com/mswjs/interceptors) - HTTP 请求拦截
- [undici](https://github.com/nodejs/undici) - HTTP/1.1 客户端
- [ws](https://github.com/websockets/ws) - WebSocket 实现
- [puppeteer](https://github.com/puppeteer/puppeteer) - 浏览器自动化

## 📮 支持

- 🐛 [报告问题](https://github.com/dong0926/node-network-devtools/issues)
- 💬 [讨论](https://github.com/dong0926/node-network-devtools/discussions)
- 📧 邮箱：xx630133368@gmail.com

---

<div align="center">

**如果这个项目对你有帮助，请给它一个 ⭐️！**

用 ❤️ 制作 by [ddddd](https://github.com/dong0926)

</div>
