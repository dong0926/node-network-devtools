# 快速开始指南

本指南将帮助你在 5 分钟内开始使用 node-network-devtools。

## 📦 安装

```bash
pnpm add @mt0926/node-network-devtools puppeteer
# 或
npm install @mt0926/node-network-devtools puppeteer
# 或
yarn add @mt0926/node-network-devtools puppeteer
```

**注意**：Puppeteer 是必需的，用于启动 GUI 浏览器窗口。如果未安装，会看到友好的错误提示。

## 🚀 两种使用方式

### 方式 1：零侵入（最简单）

通过 Node.js 的 `--import` (ESM) 或 `-r` (CommonJS) 标志注入注册入口。

**ESM:**
```bash
@mt0926/node-network-devtools/register your-script.js
```

**CommonJS:**
```bash
node -r node-network-devtools/register your-script.js
```

这会自动：
- ✅ 注入拦截器
- ✅ 启动 GUI 服务器
- ✅ 打开极简浏览器窗口

### 方式 2：编程方式

```typescript
// 在你的入口文件顶部
import { install } from '@mt0926/node-network-devtools';

await install();

// 然后是你的应用代码
import express from 'express';
const app = express();
// ...
```

## 🖥️ 查看请求

启动后，会自动打开一个极简浏览器窗口显示 GUI。

### Web GUI

**极简浏览器窗口特性：**
- 🪟 紧凑尺寸（默认 800x600）
- 🎯 无浏览器工具栏和地址栏（app 模式）
- ⚡ 快速启动（< 3 秒）
- 🎨 可自定义窗口大小和标题

**GUI 功能：**
- 📋 实时请求列表
- 🔍 搜索和过滤
- 📝 详细信息（Headers、Payload、Response、Timing）
- 🎨 深色/浅色主题
- ⏸️ 暂停/恢复

**手动访问：** 如果窗口未自动打开，查看控制台输出的 URL：
```
🚀 Node Network DevTools GUI started at http://localhost:9229
```

## 🎯 框架集成

### Next.js

1. 复制 instrumentation 文件：
```bash
cp node_modules/@mt0926/node-network-devtools/templates/instrumentation.ts ./
```

2. 启用 instrumentation（`next.config.js`）：
```javascript
module.exports = {
  experimental: {
    instrumentationHook: true,
  },
};
```

3. 启动：
```bash
npm run dev
```

**注意**：工具会在 Next.js 加载 instrumentation hook 时自动启动。

### Express

```typescript
import express from 'express';
import { install } from '@mt0926/node-network-devtools';

// 在创建 app 之前安装
await install();

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000);
```

### 其他框架

只需在应用启动前调用 `install()` 即可！

## ⚙️ 常用配置

### 环境变量

```bash
# 自定义浏览器窗口大小
NND_BROWSER_WIDTH=1024 NND_BROWSER_HEIGHT=768 @mt0926/node-network-devtools/register your-script.js

# 自定义窗口标题
NND_BROWSER_TITLE="我的应用网络监控" @mt0926/node-network-devtools/register your-script.js

# 指定 GUI 端口
NND_GUI_PORT=9230 @mt0926/node-network-devtools/register your-script.js

# 禁用自动打开浏览器
NND_AUTO_OPEN=false @mt0926/node-network-devtools/register your-script.js

# 禁用 GUI（仅存储请求数据）
NND_GUI_ENABLED=false @mt0926/node-network-devtools/register your-script.js

# 增加存储的请求数量
NND_MAX_REQUESTS=2000 @mt0926/node-network-devtools/register your-script.js
```

### 编程配置

```typescript
import { setConfig, install } from '@mt0926/node-network-devtools';

setConfig({
  maxRequests: 500,
  guiEnabled: true,
  autoOpen: false,
  browserWindowSize: { width: 1024, height: 768 },
  browserWindowTitle: '我的应用网络监控',
  redactHeaders: ['authorization', 'cookie', 'x-api-key'],
});

await install();
```

### 生产环境禁用

**重要**：此工具仅用于开发环境！

```typescript
// 条件安装
if (process.env.NODE_ENV === 'development') {
  const { install } = await import('@mt0926/node-network-devtools');
  await install();
}
```

或使用环境变量：
```bash
NODE_ENV=production NND_GUI_ENABLED=false NND_AUTO_OPEN=false node your-app.js
```

## 🔍 请求追踪

关联同一业务流程中的多个请求：

```typescript
import { runWithTrace } from '@mt0926/node-network-devtools';

await runWithTrace('user-login', async () => {
  // 这些请求会被关联到同一个 traceId
  await fetch('https://api.example.com/auth');
  await fetch('https://api.example.com/user');
  await fetch('https://api.example.com/profile');
});
```

在 GUI 中，你可以按 traceId 过滤查看相关请求。

## 📝 实际示例

### 监控 HTTP 请求

```typescript
import http from 'http';
import { install } from '@mt0926/node-network-devtools';

await install();

// 发起请求
http.get('http://api.example.com/users', (res) => {
  console.log('Status:', res.statusCode);
});
```

### 监控 Fetch 请求

```typescript
import { install } from '@mt0926/node-network-devtools';

await install();

// 发起 fetch 请求
const response = await fetch('https://api.example.com/data');
const data = await response.json();
```

### Express 服务器

```typescript
import express from 'express';
import { install } from '@mt0926/node-network-devtools';

await install();

const app = express();

app.get('/api/users', async (req, res) => {
  // 这个请求会被监控
  const users = await fetch('https://jsonplaceholder.typicode.com/users');
  const data = await users.json();
  res.json(data);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## 🐛 常见问题

### Q: GUI 没有自动打开？

**A:** 检查：
1. 是否设置了 `NND_AUTO_OPEN=false`
2. 是否安装了 Puppeteer（`pnpm add puppeteer`）
3. 手动访问控制台输出的 URL

### Q: Puppeteer 安装失败？

**A:** 尝试：
```bash
# 使用国内镜像
PUPPETEER_DOWNLOAD_HOST=https://npmmirror.com/mirrors pnpm add puppeteer

# 或跳过 Chromium 下载（使用系统浏览器）
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true pnpm add puppeteer
```

### Q: 看不到请求？

**A:** 确保：
1. 在发起请求前调用了 `install()`
2. 使用的是 http/https 模块或 fetch API
3. 检查拦截器是否启用（`NND_INTERCEPT_HTTP=true`）

### Q: Next.js 的 fetch 请求看不到？

**A:** Next.js 14+ 使用了自定义的 fetch 实现，目前无法拦截。解决方案：
1. 使用 http/https 模块
2. 查看 `examples/nextjs-app/TROUBLESHOOTING.md`

### Q: 如何在 CI/CD 环境中使用？

**A:** 在 CI 环境中禁用 GUI：
```bash
CI=true NND_GUI_ENABLED=false NND_AUTO_OPEN=false node your-app.js
```

### Q: 浏览器窗口太小/太大？

**A:** 自定义窗口大小：
```bash
NND_BROWSER_WIDTH=1280 NND_BROWSER_HEIGHT=720 @mt0926/node-network-devtools/register your-script.js
```

## 📚 下一步

- 📖 阅读完整 [README](../../README.md)
- 🔧 查看 [配置选项](../../README.md#配置)
- 📝 浏览 [示例代码](../../examples)
- 🤝 阅读 [贡献指南](../../CONTRIBUTING.md)

## 💡 提示

1. **开发环境专用**：这个工具仅用于开发和调试，不要在生产环境使用
2. **Puppeteer 依赖**：需要安装 Puppeteer 才能使用 GUI 浏览器窗口
3. **性能影响**：拦截会有轻微的性能开销
4. **敏感数据**：默认会脱敏 Authorization 和 Cookie 头
5. **存储限制**：默认只保存最近 1000 个请求
6. **窗口定制**：可以通过环境变量自定义浏览器窗口大小和标题

## 🆘 需要帮助？

- 💬 [GitHub Discussions](https://github.com/dong0926/node-network-devtools/discussions)
- 🐛 [报告问题](https://github.com/dong0926/node-network-devtools/issues)
- 📧 Email: your.email@example.com

---

开始监控你的网络请求吧！🚀
