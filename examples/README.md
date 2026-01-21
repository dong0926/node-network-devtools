# Node Network DevTools 示例

本目录包含多个示例项目，演示 node-network-devtools 的各种使用方式。

## 🎉 Web GUI 功能

node-network-devtools 提供了内置的 Web GUI 界面，可以在浏览器中实时查看和分析 Node.js 应用的网络请求。

### 启用 GUI

使用 `--import` (ESM) 或 `-r` (CJS) 注入注册入口：

**ESM:**
```bash
node --import node-network-devtools/register your-script.js
```

**CommonJS:**
```bash
node -r node-network-devtools/register your-script.js
```

启动后会自动打开浏览器，显示类似 Chrome DevTools Network 面板的界面。

### 环境变量配置

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `NND_GUI_ENABLED` | 是否启用 GUI | `true` |
| `NND_GUI_PORT` | GUI 端口 | 自动获取 |
| `NND_WS_PORT` | WebSocket 端口 | 自动获取 |
| `NND_AUTO_OPEN` | 是否自动打开浏览器 | `true` |

## 重要说明

⚠️ **仅限开发环境**

本工具旨在本地开发环境中使用。在生产环境中，请确保禁用 GUI (`NND_GUI_ENABLED=false`) 且不加载注册入口。

## 示例列表

| 示例 | 说明 |
|------|------|
| [basic-http](./basic-http) | 基础 HTTP 模块请求监听 |
| [fetch-api](./fetch-api) | Node.js 原生 fetch API 监听 |
| [commonjs-usage](./commonjs-usage) | CommonJS 模块系统使用示例 |
| [request-tracing](./request-tracing) | 使用 TraceID 关联请求 |
| [express-server](./express-server) | Web 服务器中监听外部 API 调用 |
| [programmatic-api](./programmatic-api) | 编程式 API 使用 |
| [nextjs-app](./nextjs-app) | Next.js App Router 集成示例 |

## 运行前准备

1. 确保已构建主项目：

```bash
cd ..
pnpm build
```

2. 进入示例目录运行：

```bash
cd examples/basic-http
pnpm start
```

## 查看网络请求

### 方式一：Web GUI（推荐）

通过 `register` 注入启动，默认会自动打开浏览器显示网络请求面板：

```bash
node --import node-network-devtools/register your-script.js
```

GUI 功能：
- 实时显示请求列表
- 查看请求/响应详情
- 按方法、状态码、URL 过滤
- 暂停/恢复请求捕获
- 深色/浅色主题切换

禁用自动打开浏览器：

```bash
NND_AUTO_OPEN=false node --import node-network-devtools/register your-script.js
```

### 方式二：控制台日志

启动示例后，拦截到的信息会输出到控制台（如果配置了输出）。

### 方式三：编程 API

```javascript
import { getRequestStore } from 'node-network-devtools';

// 获取所有捕获的请求
const store = getRequestStore();
const requests = store.getAll();
console.log(requests);
```

## 常见问题

### Q: 看不到网络请求？

确保正确加载了 `register` 入口：

```bash
node --import node-network-devtools/register your-script.js
```

### Q: 如何在生产环境使用？

不建议在生产环境使用。此工具主要用于开发和调试。

### Q: 支持 HTTPS 请求吗？

支持。`http`、`https` 和 `fetch` 的请求都会被捕获。

