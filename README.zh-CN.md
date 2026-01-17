<div align="center">

# 🔍 Node Network DevTools

**Node.js 网络请求监控工具，集成 Chrome DevTools 和内置 Web GUI**

[![npm version](https://img.shields.io/npm/v/node-network-devtools.svg)](https://www.npmjs.com/package/node-network-devtools)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/node-network-devtools.svg)](https://nodejs.org)

[English](./README.md) | [中文文档](#)

</div>

---

## ⚠️ 仅限开发环境使用

**本工具仅用于开发环境，请勿在生产环境中使用！**

- 使用 Puppeteer 启动极简浏览器窗口显示 GUI
- 拦截所有网络请求可能影响性能
- 在内存中存储请求/响应数据
- 不适合生产环境工作负载

### 在生产环境中禁用

```javascript
// 条件安装
if (process.env.NODE_ENV === 'development') {
  await install();
}
```

或使用环境变量：

```bash
# 禁用 GUI 和自动打开
NND_GUI_ENABLED=false NND_AUTO_OPEN=false node your-app.js
```

## ✨ 特性

- 🔍 **双重拦截** - 同时支持 `http/https` 模块和 `undici/fetch` API
- 🎯 **零侵入** - 通过 `-r` 或 `--import` 自动注入，无需修改代码
- 🖥️ **极简浏览器窗口** - Puppeteer 驱动的紧凑 GUI 窗口（800x600）
- 📊 **内置 Web GUI** - 类似 Chrome DevTools 的界面，实时更新
- 🔗 **请求追踪** - 基于 AsyncLocalStorage 的请求关联
- 🛡️ **安全性** - 自动脱敏敏感请求头（Authorization、Cookie 等）
- ⚡ **Next.js 兼容** - 保留 `next.revalidate`、`next.tags` 等选项
- 📦 **TypeScript** - 完整的 TypeScript 支持和类型定义

## 📸 截图

### Web GUI 界面
![Web GUI](https://via.placeholder.com/800x450?text=Web+GUI+Screenshot)

### Chrome DevTools 集成
![Chrome DevTools](https://via.placeholder.com/800x450?text=Chrome+DevTools+Screenshot)

## 🚀 快速开始

### 安装

```bash
npm install node-network-devtools puppeteer
# 或
pnpm add node-network-devtools puppeteer
# 或
yarn add node-network-devtools puppeteer
```

**注意**：Puppeteer 是 GUI 浏览器窗口所必需的。如果未安装，您会看到友好的错误消息和安装指引。

### 使用

#### 方式一：CLI（推荐）

```bash
npx node-network-devtools your-script.js
# 或使用短别名
npx nnd your-script.js
```

CLI 会自动注入拦截器并打开 GUI。

#### 方式二：使用 `-r` 标志

```bash
node -r node-network-devtools/register your-script.js
```

#### 方式三：编程方式

```typescript
import { install } from 'node-network-devtools';

await install();

// 你的应用代码
import express from 'express';
const app = express();
// ...
```

### 查看请求

启动应用后：

- **Web GUI**（默认）：极简浏览器窗口会自动打开显示 GUI
  - 紧凑的窗口大小（默认 800x600）
  - 可自定义窗口大小和标题
  - 无浏览器工具栏或地址栏（app 模式）

要手动访问 GUI，请查看控制台输出中的 URL：
```
🚀 Node Network DevTools GUI started at http://localhost:9229
```

## 🖥️ Web GUI

内置的 Web GUI 提供类似 Chrome DevTools 的网络请求监控体验。

### 极简浏览器窗口

GUI 在极简的 Puppeteer 控制的浏览器窗口中打开：

- **紧凑尺寸**：默认 800x600，可通过环境变量自定义
- **App 模式**：无浏览器工具栏、地址栏或其他界面元素
- **自定义标题**：默认显示 "Node Network DevTools"
- **快速启动**：3 秒内打开

### 功能特性

- 📋 **请求列表** - 实时显示所有网络请求
- 🔍 **搜索过滤** - 按 URL、方法、状态码和类型过滤
- 📝 **详情面板** - 查看请求头、请求体、响应和时序信息
- 🎨 **主题切换** - 支持深色/浅色主题
- ⏸️ **暂停/恢复** - 暂停请求捕获以便分析
- 🔄 **实时更新** - 基于 WebSocket 的实时更新

### GUI 配置

```bash
# 自定义窗口大小
NND_BROWSER_WIDTH=1024 NND_BROWSER_HEIGHT=768 npx nnd your-script.js

# 自定义窗口标题
NND_BROWSER_TITLE="我的应用网络监控" npx nnd your-script.js

# 指定 GUI 端口
NND_GUI_PORT=9230 npx nnd your-script.js

# 指定 WebSocket 端口
NND_WS_PORT=9231 npx nnd your-script.js

# 禁用 GUI
NND_GUI_ENABLED=false npx nnd your-script.js

# 禁用自动打开浏览器
NND_AUTO_OPEN=false npx nnd your-script.js
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

### 编程配置

```typescript
import { setConfig } from 'node-network-devtools';

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
  const { install } = await import('node-network-devtools');
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
import { install } from 'node-network-devtools';

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
import { install, startGUI, stopGUI } from 'node-network-devtools';

// 配置
import { getConfig, setConfig, resetConfig } from 'node-network-devtools';

// 请求存储
import { getRequestStore } from 'node-network-devtools';

// 上下文追踪
import { 
  runWithTrace, 
  getCurrentTraceId,
  generateTraceId 
} from 'node-network-devtools';

// 拦截器
import { HttpPatcher, UndiciPatcher } from 'node-network-devtools';
```

### 请求追踪

关联同一业务流程中的多个请求：

```typescript
import { runWithTrace, getRequestStore } from 'node-network-devtools';

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
5. **极简浏览器**：使用 Puppeteer 在 app 模式下启动紧凑的浏览器窗口

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
- 📧 邮箱：your.email@example.com

---

<div align="center">

**如果这个项目对你有帮助，请给它一个 ⭐️！**

用 ❤️ 制作 by [ddddd](https://github.com/dong0926)

</div>
