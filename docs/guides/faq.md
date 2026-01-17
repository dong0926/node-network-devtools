# 常见问题（FAQ）

## 📋 目录

- [安装和设置](#安装和设置)
- [使用问题](#使用问题)
- [框架集成](#框架集成)
- [GUI 相关](#gui-相关)
- [性能和限制](#性能和限制)
- [故障排除](#故障排除)

## 安装和设置

### Q: 支持哪些 Node.js 版本？

**A:** Node.js >= 18.0.0。我们推荐使用 LTS 版本（18.x 或 20.x）。

### Q: 必须使用 pnpm 吗？

**A:** 不是必须的。你可以使用 npm、yarn 或 pnpm。但项目开发使用 pnpm，所以我们推荐使用 pnpm。

```bash
# npm
npm install node-network-devtools

# yarn
yarn add node-network-devtools

# pnpm
pnpm add node-network-devtools
```

### Q: 如何在 TypeScript 项目中使用？

**A:** 直接导入即可，包含完整的类型定义：

```typescript
import { install, setConfig } from 'node-network-devtools';

await install();
```

## 使用问题

### Q: 为什么看不到任何请求？

**A:** 请检查以下几点：

1. **是否使用了 `--inspect` 标志？**
   ```bash
   node --inspect your-script.js
   ```

2. **是否在发起请求前安装了拦截器？**
   ```typescript
   import { install } from 'node-network-devtools';
   await install(); // 必须在发起请求前调用
   ```

3. **使用的是支持的 HTTP 客户端吗？**
   - ✅ http/https 模块
   - ✅ fetch API
   - ✅ undici
   - ❌ axios（暂不支持）
   - ❌ got（暂不支持）

### Q: 如何拦截 axios 或 got 的请求？

**A:** 目前不直接支持。这些库使用了自己的请求实现。解决方案：

1. 使用 fetch API 或 http/https 模块
2. 等待未来版本的支持
3. 贡献代码添加支持 😊

### Q: 可以在生产环境使用吗？

**A:** **不推荐**。这个工具主要用于开发和调试。如果必须在生产环境使用：

```bash
# 禁用 GUI 和自动连接
NND_GUI_ENABLED=false \
NND_AUTO_CONNECT=false \
NND_MAX_REQUESTS=100 \
node your-app.js
```

注意：
- 拦截会有性能开销
- 存储请求会占用内存
- 可能暴露敏感信息

### Q: 如何脱敏更多的敏感头？

**A:** 使用配置：

```typescript
import { setConfig } from 'node-network-devtools';

setConfig({
  redactHeaders: [
    'authorization',
    'cookie',
    'x-api-key',
    'x-custom-token',
    'x-secret-key',
  ],
});
```

或使用环境变量：

```bash
NND_REDACT_HEADERS=authorization,cookie,x-api-key npx nnd your-script.js
```

## 框架集成

### Q: Next.js 的 fetch 请求为什么看不到？

**A:** Next.js 14+ 使用了自定义的 fetch 实现，绕过了 undici 的全局 dispatcher。

**解决方案：**

1. **使用 http/https 模块**（推荐）：
   ```typescript
   import https from 'https';
   
   export async function createUser(data) {
     return new Promise((resolve, reject) => {
       const req = https.request('https://api.example.com/users', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
       }, (res) => {
         // 处理响应
       });
       req.write(JSON.stringify(data));
       req.end();
     });
   }
   ```

2. **监控 API Routes**：
   API Routes 的传入请求会被捕获

3. **等待未来支持**：
   我们正在研究解决方案

详见：`examples/nextjs-app/TROUBLESHOOTING.md`

### Q: Express 中间件的请求能看到吗？

**A:** 可以！Express 使用 http 模块，所有请求都会被捕获。

```typescript
import express from 'express';
import { install } from 'node-network-devtools';

await install();

const app = express();

app.get('/api/data', async (req, res) => {
  // 这个请求会被监控
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
  res.json(data);
});
```

### Q: 如何在 NestJS 中使用？

**A:** 在 `main.ts` 中安装：

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { install } from 'node-network-devtools';

async function bootstrap() {
  await install();
  
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

启动时添加 `--inspect`：

```bash
node --inspect dist/main.js
```

## GUI 相关

### Q: GUI 没有自动打开怎么办？

**A:** 可能的原因：

1. **设置了 `NND_AUTO_OPEN=false`**
   - 检查环境变量

2. **没有安装浏览器**
   - 需要 Chrome、Edge 或 Firefox

3. **权限问题（Windows）**
   - 手动访问控制台输出的 URL

4. **端口被占用**
   - 使用 `NND_GUI_PORT` 指定其他端口

**解决方案：**
查看控制台输出，手动访问显示的 URL：
```
[GUI Server] GUI 服务器运行在: http://localhost:9229
```

### Q: 如何更改 GUI 端口？

**A:** 使用环境变量：

```bash
NND_GUI_PORT=8080 npx nnd your-script.js
```

或编程配置：

```typescript
import { setConfig } from 'node-network-devtools';

setConfig({
  guiPort: 8080,
});
```

### Q: GUI 不显示实时更新？

**A:** 检查：

1. **WebSocket 连接是否正常**
   - 打开浏览器开发者工具，查看 Console 和 Network 标签

2. **防火墙是否阻止了 WebSocket**
   - 临时关闭防火墙测试

3. **端口是否被占用**
   - 使用 `NND_WS_PORT` 指定其他端口

### Q: 如何禁用 GUI？

**A:** 使用环境变量：

```bash
NND_GUI_ENABLED=false node --inspect -r node-network-devtools/register your-script.js
```

这样只使用 Chrome DevTools，不启动 Web GUI。

## 性能和限制

### Q: 对性能有多大影响？

**A:** 影响很小，但确实存在：

- **拦截开销**：每个请求约 1-2ms
- **内存占用**：取决于存储的请求数量
- **序列化开销**：大请求体会有额外开销

**建议：**
- 开发环境：无需担心
- 生产环境：不推荐使用
- 性能测试：禁用拦截器

### Q: 最多能存储多少请求？

**A:** 默认 1000 个。可以配置：

```bash
NND_MAX_REQUESTS=2000 npx nnd your-script.js
```

或：

```typescript
setConfig({ maxRequests: 2000 });
```

注意：存储更多请求会占用更多内存。

### Q: 大请求体会被截断吗？

**A:** 是的。默认限制为 1MB。可以配置：

```bash
NND_MAX_BODY_SIZE=2097152 npx nnd your-script.js  # 2MB
```

或：

```typescript
setConfig({ maxBodySize: 2 * 1024 * 1024 }); // 2MB
```

### Q: 如何清空已存储的请求？

**A:** 在 GUI 中点击 "Clear" 按钮，或编程方式：

```typescript
import { getRequestStore } from 'node-network-devtools';

const store = getRequestStore();
store.clear();
```

## 故障排除

### Q: 报错 "Cannot find module 'node-network-devtools'"

**A:** 确保已安装：

```bash
pnpm install node-network-devtools
```

如果使用 `-r` 标志，确保路径正确：

```bash
node --inspect -r node-network-devtools/register your-script.js
```

### Q: 报错 "Inspector is not enabled"

**A:** 需要使用 `--inspect` 标志启动：

```bash
node --inspect your-script.js
```

或使用 CLI（自动添加）：

```bash
npx nnd your-script.js
```

### Q: WebSocket 连接失败

**A:** 检查：

1. **端口是否被占用**
   ```bash
   # Windows
   netstat -ano | findstr :9230
   
   # macOS/Linux
   lsof -i :9230
   ```

2. **防火墙设置**
   - 允许本地连接

3. **使用其他端口**
   ```bash
   NND_WS_PORT=9999 npx nnd your-script.js
   ```

### Q: GUI 显示空白页面

**A:** 可能原因：

1. **GUI 未构建**
   ```bash
   pnpm build:gui
   ```

2. **静态文件路径错误**
   - 检查 `dist/gui` 目录是否存在

3. **浏览器缓存**
   - 清除缓存或使用无痕模式

### Q: 在 Docker 容器中使用

**A:** 需要暴露端口：

```dockerfile
# Dockerfile
EXPOSE 9229 9230

# 启动时
docker run -p 9229:9229 -p 9230:9230 your-image
```

并设置主机：

```bash
NND_GUI_HOST=0.0.0.0 node --inspect=0.0.0.0:9229 your-script.js
```

### Q: Windows 上路径问题

**A:** 使用正斜杠或双反斜杠：

```bash
# 正确
node --inspect -r node-network-devtools/register your-script.js

# 或
node --inspect -r node-network-devtools\\register your-script.js
```

## 其他问题

### Q: 如何贡献代码？

**A:** 欢迎贡献！请阅读 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

### Q: 如何报告 bug？

**A:** 在 GitHub 上创建 issue：
https://github.com/dong0926/node-network-devtools/issues

### Q: 支持哪些操作系统？

**A:** 
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux（Ubuntu、Debian、CentOS 等）

### Q: 有计划支持 Deno 或 Bun 吗？

**A:** 目前专注于 Node.js。未来可能会考虑支持其他运行时。

### Q: 可以导出请求数据吗？

**A:** 目前不支持。这是一个计划中的功能。你可以：

1. 在 GitHub 上投票支持这个功能
2. 贡献代码实现这个功能

### Q: 如何获取帮助？

**A:** 
- 💬 [GitHub Discussions](https://github.com/dong0926/node-network-devtools/discussions)
- 🐛 [Issue Tracker](https://github.com/dong0926/node-network-devtools/issues)
- 📧 Email: your.email@example.com

---

没有找到你的问题？在 [GitHub Discussions](https://github.com/dong0926/node-network-devtools/discussions) 提问！
