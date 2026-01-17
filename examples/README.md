# Node Network DevTools 示例

本目录包含多个示例项目，演示 node-network-devtools 的各种使用方式。

## 🎉 Web GUI 功能

node-network-devtools 提供了内置的 Web GUI 界面，可以在浏览器中实时查看和分析 Node.js 应用的网络请求。

### 启用 GUI

使用 CLI 启动时添加 `--gui` 选项：

```bash
npx node-network-devtools --gui your-script.js
```

启动后会自动打开浏览器，显示类似 Chrome DevTools Network 面板的界面。

### GUI 选项

| 选项 | 说明 |
|------|------|
| `--gui` | 启用 Web GUI |
| `--gui-port=PORT` | 指定 GUI 端口（默认: 自动获取） |
| `--ws-port=PORT` | 指定 WebSocket 端口（默认: 自动获取） |
| `--no-open` | 不自动打开浏览器 |

### 环境变量配置

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `NND_GUI_ENABLED` | 是否启用 GUI | `false` |
| `NND_GUI_PORT` | GUI 端口 | 自动获取 |
| `NND_WS_PORT` | WebSocket 端口 | 自动获取 |
| `NND_AUTO_OPEN` | 是否自动打开浏览器 | `true` |

## 重要说明

⚠️ **Chrome DevTools Network 面板限制**

Node.js 的 `inspector.Network` API 是实验性功能（Node.js 20.18.0+），需要 `--experimental-network-inspection` 标志。

**当前状态**：Chrome DevTools 的 Network 面板目前还不支持显示 Node.js 发出的网络事件。这是 Chrome DevTools 侧的功能限制，需要等待 Chrome 团队实现相关支持。

**替代方案**：
- 🌟 **使用内置 Web GUI**（推荐）- 添加 `--gui` 选项启动
- 请求数据会在控制台中输出
- 可以通过编程 API 访问捕获的请求数据
- 参考 [programmatic-api](./programmatic-api) 示例

## 示例列表

| 示例 | 说明 |
|------|------|
| [basic-http](./basic-http) | 基础 HTTP 模块请求监听 |
| [fetch-api](./fetch-api) | Node.js 原生 fetch API 监听 |
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

使用 `--gui` 选项启动，会自动打开浏览器显示网络请求面板：

```bash
npx node-network-devtools --gui your-script.js
```

GUI 功能：
- 实时显示请求列表
- 查看请求/响应详情
- 按方法、状态码、URL 过滤
- 暂停/恢复请求捕获
- 深色/浅色主题切换

禁用自动打开浏览器：

```bash
npx node-network-devtools --gui --no-open your-script.js
```

### 方式二：控制台日志

启动示例后，网络请求会在控制台中输出，包括：
- 请求方法和 URL
- 响应状态码
- 请求耗时

### 方式三：编程 API

```javascript
import { getRequestStore } from 'node-network-devtools';

// 获取所有捕获的请求
const requests = getRequestStore().getAll();
console.log(requests);
```

### 方式四：Chrome DevTools（实验性）

1. 使用 Node.js 20.18.0+ 版本
2. 添加 `--experimental-network-inspection` 标志
3. 打开 Chrome 浏览器，访问 `chrome://inspect`
4. 在 "Remote Target" 下找到你的 Node.js 进程
5. 点击 "inspect" 打开 DevTools

注意：Network 面板可能还不支持显示这些事件。

## 常见问题

### Q: 看不到网络请求？

确保使用 `--inspect` 标志启动 Node.js，或使用 CLI：

```bash
npx node-network-devtools your-script.js
```

### Q: Network 面板为什么是空的？

这是 Chrome DevTools 的当前限制。请使用控制台日志或编程 API 查看请求数据。

### Q: 如何在生产环境使用？

不建议在生产环境启用 `--inspect`。此工具主要用于开发和调试。

### Q: 支持 HTTPS 请求吗？

支持。`http`、`https` 和 `fetch` 的请求都会被捕获。
