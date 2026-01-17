# 快速开始指南

本指南将帮助你在 5 分钟内开始使用 node-network-devtools。

## 📦 安装

```bash
pnpm add node-network-devtools
# 或
npm install node-network-devtools
# 或
yarn add node-network-devtools
```

## 🚀 三种使用方式

### 方式 1：CLI（最简单）

```bash
# 使用完整命令
npx node-network-devtools your-script.js

# 或使用短别名
npx nnd your-script.js
```

这会自动：
- ✅ 添加 `--inspect` 标志
- ✅ 注入拦截器
- ✅ 启动 GUI
- ✅ 打开浏览器

### 方式 2：使用 -r 标志

```bash
node --inspect -r node-network-devtools/register your-script.js
```

### 方式 3：编程方式

```typescript
// 在你的入口文件顶部
import { install } from 'node-network-devtools';

await install();

// 然后是你的应用代码
import express from 'express';
const app = express();
// ...
```

## 🖥️ 查看请求

启动后，你会看到两种方式查看请求：

### 1. Web GUI（推荐）

浏览器会自动打开，显示类似 Chrome DevTools 的界面。

**功能：**
- 📋 实时请求列表
- 🔍 搜索和过滤
- 📝 详细信息（Headers、Payload、Response、Timing）
- 🎨 深色/浅色主题
- ⏸️ 暂停/恢复

### 2. Chrome DevTools

1. 打开 Chrome 浏览器
2. 访问 `chrome://inspect`
3. 点击 "Open dedicated DevTools for Node"
4. 切换到 Network 标签

## 🎯 框架集成

### Next.js

1. 复制 instrumentation 文件：
```bash
cp node_modules/node-network-devtools/templates/instrumentation.ts ./
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
# Windows
set NODE_OPTIONS=--inspect && npm run dev

# macOS/Linux
NODE_OPTIONS='--inspect' npm run dev

# 或使用 cross-env（跨平台）
npx cross-env NODE_OPTIONS='--inspect' npm run dev
```

### Express

```typescript
import express from 'express';
import { install } from 'node-network-devtools';

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
# 指定 GUI 端口
NND_GUI_PORT=9230 npx nnd your-script.js

# 禁用自动打开浏览器
NND_AUTO_OPEN=false npx nnd your-script.js

# 禁用 GUI（只使用 Chrome DevTools）
NND_GUI_ENABLED=false npx nnd your-script.js

# 增加存储的请求数量
NND_MAX_REQUESTS=2000 npx nnd your-script.js
```

### 编程配置

```typescript
import { setConfig, install } from 'node-network-devtools';

setConfig({
  maxRequests: 500,
  guiEnabled: true,
  autoOpen: false,
  redactHeaders: ['authorization', 'cookie', 'x-api-key'],
});

await install();
```

## 🔍 请求追踪

关联同一业务流程中的多个请求：

```typescript
import { runWithTrace } from 'node-network-devtools';

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
import { install } from 'node-network-devtools';

await install();

// 发起请求
http.get('http://api.example.com/users', (res) => {
  console.log('Status:', res.statusCode);
});
```

### 监控 Fetch 请求

```typescript
import { install } from 'node-network-devtools';

await install();

// 发起 fetch 请求
const response = await fetch('https://api.example.com/data');
const data = await response.json();
```

### Express 服务器

```typescript
import express from 'express';
import { install } from 'node-network-devtools';

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
2. 是否安装了浏览器（需要 Chrome、Edge 或 Firefox）
3. 手动访问控制台输出的 URL

### Q: 看不到请求？

**A:** 确保：
1. 使用了 `--inspect` 标志启动
2. 在发起请求前调用了 `install()`
3. 使用的是 http/https 模块或 fetch API

### Q: Next.js 的 fetch 请求看不到？

**A:** Next.js 14+ 使用了自定义的 fetch 实现，目前无法拦截。解决方案：
1. 使用 http/https 模块
2. 查看 `examples/nextjs-app/TROUBLESHOOTING.md`

### Q: 如何在生产环境使用？

**A:** 不建议在生产环境使用。如果必须使用，请：
```bash
NND_GUI_ENABLED=false \
NND_AUTO_CONNECT=false \
NND_MAX_REQUESTS=100 \
node your-app.js
```

## 📚 下一步

- 📖 阅读完整 [README](../../README.md)
- 🔧 查看 [配置选项](../../README.md#配置)
- 📝 浏览 [示例代码](../../examples)
- 🤝 阅读 [贡献指南](../../CONTRIBUTING.md)

## 💡 提示

1. **开发环境专用**：这个工具主要用于开发和调试
2. **性能影响**：拦截会有轻微的性能开销
3. **敏感数据**：默认会脱敏 Authorization 和 Cookie 头
4. **存储限制**：默认只保存最近 1000 个请求

## 🆘 需要帮助？

- 💬 [GitHub Discussions](https://github.com/dong0926/node-network-devtools/discussions)
- 🐛 [报告问题](https://github.com/dong0926/node-network-devtools/issues)
- 📧 Email: your.email@example.com

---

开始监控你的网络请求吧！🚀
