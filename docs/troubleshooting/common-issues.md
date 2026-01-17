# 常见问题排查

本文档汇总了使用 node-network-devtools 时可能遇到的常见问题及解决方案。

## 📋 目录

- [安装问题](#安装问题)
- [Puppeteer 问题](#puppeteer-问题)
- [启动问题](#启动问题)
- [请求监控问题](#请求监控问题)
- [GUI 问题](#gui-问题)
- [框架集成问题](#框架集成问题)
- [性能问题](#性能问题)

## 安装问题

### 问题：安装失败

**症状：**
```bash
npm ERR! code ENOENT
npm ERR! syscall open
```

**解决方案：**
1. 清理 npm 缓存：
   ```bash
   npm cache clean --force
   ```

2. 删除 node_modules 重新安装：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. 使用其他包管理器：
   ```bash
   pnpm install
   # 或
   yarn install
   ```

### 问题：TypeScript 类型定义缺失

**症状：**
```typescript
Cannot find module 'node-network-devtools' or its corresponding type declarations.
```

**解决方案：**
1. 确保安装了最新版本
2. 重新安装：
   ```bash
   npm install node-network-devtools@latest
   ```

### 问题：Puppeteer 安装失败

**症状：**
```bash
ERROR: Failed to set up Chromium
```

**解决方案：**
1. 使用国内镜像：
   ```bash
   PUPPETEER_DOWNLOAD_HOST=https://npmmirror.com/mirrors pnpm add puppeteer
   ```

2. 跳过 Chromium 下载：
   ```bash
   PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true pnpm add puppeteer
   ```

3. 手动指定 Chromium 路径：
   ```bash
   PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium pnpm add puppeteer
   ```

## Puppeteer 问题

### 问题：Puppeteer not installed

**症状：**
```
Error: Puppeteer is not installed. Please install it to use the GUI browser window.
```

**解决方案：**
1. 安装 Puppeteer：
   ```bash
   pnpm add puppeteer
   ```

2. 或禁用 GUI：
   ```bash
   NND_GUI_ENABLED=false node your-script.js
   ```

3. 或禁用自动打开（手动访问 URL）：
   ```bash
   NND_AUTO_OPEN=false node your-script.js
   ```

### 问题：Puppeteer 启动失败

**症状：**
```
Error: Failed to launch the browser process
```

**解决方案：**

**Linux 系统：**
安装必需的系统依赖：
```bash
# Ubuntu/Debian
sudo apt-get install -y \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2

# CentOS/RHEL
sudo yum install -y \
  nss atk at-spi2-atk cups-libs libdrm libXcomposite \
  libXdamage libXrandr mesa-libgbm alsa-lib
```

**Docker 容器：**
```dockerfile
FROM node:18

# 安装 Chromium 和依赖
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 或者禁用 GUI
ENV NND_GUI_ENABLED=false
ENV NND_AUTO_OPEN=false
```

**权限问题：**
工具会自动添加 `--no-sandbox` 参数，但如果仍有问题：
```bash
# 临时解决方案（不推荐用于生产）
NND_AUTO_OPEN=false node your-script.js
```

### 问题：浏览器窗口太小/太大

**解决方案：**
自定义窗口大小：

```bash
# 环境变量
NND_BROWSER_WIDTH=1280 NND_BROWSER_HEIGHT=720 npx nnd your-script.js

# 或编程配置
setConfig({
  browserWindowSize: { width: 1280, height: 720 }
});
```

### 问题：在 CI 环境中 Puppeteer 失败

**解决方案：**
CI 环境中禁用 GUI：

```yaml
# GitHub Actions
- name: Run tests
  env:
    CI: true
    NND_GUI_ENABLED: false
    NND_AUTO_OPEN: false
  run: npm test
```

工具会自动检测 CI 环境变量（`CI=true`）并禁用自动打开。

## 启动问题

### 问题：端口被占用

**症状：**
```
Error: listen EADDRINUSE: address already in use :::9229
```

**解决方案：**
1. 查找占用端口的进程：
   ```bash
   # Windows
   netstat -ano | findstr :9229
   
   # macOS/Linux
   lsof -i :9229
   ```

2. 终止进程或使用其他端口：
   ```bash
   NND_GUI_PORT=8080 npx nnd your-script.js
   ```

### 问题：模块找不到

**症状：**
```
Error: Cannot find module 'node-network-devtools'
```

**解决方案：**
1. 确保已安装：
   ```bash
   npm install node-network-devtools
   ```

2. 检查路径（使用 -r 标志时）：
   ```bash
   node --inspect -r node-network-devtools/register your-script.js
   ```

## 请求监控问题

### 问题：看不到任何请求

**可能原因：**
1. 未在发起请求前调用 `install()`
2. 使用了不支持的 HTTP 客户端
3. 拦截器未启用

**解决方案：**

1. **确保正确初始化：**
   ```typescript
   import { install } from 'node-network-devtools';
   
   // 必须在发起请求前调用
   await install();
   
   // 然后发起请求
   await fetch('https://api.example.com/data');
   ```

2. **检查 HTTP 客户端兼容性：**
   - ✅ 支持：http/https 模块、fetch API、undici
   - ❌ 不支持：axios、got、request

3. **检查拦截器配置：**
   ```bash
   NND_INTERCEPT_HTTP=true NND_INTERCEPT_UNDICI=true node your-script.js
   ```

### 问题：部分请求看不到

**可能原因：**
- 请求在 `install()` 之前发起
- 使用了不支持的客户端
- 请求被过滤或忽略

**解决方案：**
1. 确保 `install()` 在最早执行
2. 检查配置中的 `ignoreUrls` 选项
3. 查看控制台是否有错误信息

### 问题：axios 请求看不到

**原因：**
axios 使用自己的 HTTP 实现，目前不支持拦截。

**解决方案：**
1. 使用 fetch API 或 http/https 模块
2. 等待未来版本支持
3. 贡献代码添加 axios 支持

## GUI 问题

### 问题：GUI 没有自动打开

**可能原因：**
1. 设置了 `NND_AUTO_OPEN=false`
2. Puppeteer 未安装
3. Puppeteer 启动失败
4. 在 CI 环境中运行

**解决方案：**
1. 检查环境变量：
   ```bash
   echo $NND_AUTO_OPEN
   ```

2. 确保安装了 Puppeteer：
   ```bash
   pnpm add puppeteer
   ```

3. 手动访问 URL（查看控制台输出）：
   ```
   🚀 Node Network DevTools GUI started at http://localhost:9229
   ```

4. 检查 Puppeteer 错误信息（查看控制台）

### 问题：GUI 显示空白页面

**可能原因：**
1. GUI 未构建
2. 静态文件路径错误
3. 浏览器缓存

**解决方案：**
1. 重新构建 GUI：
   ```bash
   pnpm build:gui
   ```

2. 清除浏览器缓存或使用无痕模式

3. 检查 `dist/gui` 目录是否存在

### 问题：GUI 不显示实时更新

**可能原因：**
1. WebSocket 连接失败
2. 防火墙阻止
3. 端口被占用

**解决方案：**
1. 打开浏览器开发者工具，检查 WebSocket 连接状态

2. 临时关闭防火墙测试

3. 使用其他端口：
   ```bash
   NND_WS_PORT=9999 npx nnd your-script.js
   ```

### 问题：WebSocket 连接失败

**症状：**
```
WebSocket connection to 'ws://localhost:9230' failed
```

**解决方案：**
1. 检查端口是否被占用：
   ```bash
   # Windows
   netstat -ano | findstr :9230
   
   # macOS/Linux
   lsof -i :9230
   ```

2. 使用其他端口：
   ```bash
   NND_WS_PORT=9999 npx nnd your-script.js
   ```

3. 检查防火墙设置

## 框架集成问题

### 问题：Next.js fetch 请求看不到

**原因：**
Next.js 14+ 使用了自定义的 fetch 实现，绕过了 undici 的全局 dispatcher。

**解决方案：**
1. 使用 http/https 模块：
   ```typescript
   import https from 'https';
   
   export async function fetchData() {
     return new Promise((resolve, reject) => {
       https.get('https://api.example.com/data', (res) => {
         let data = '';
         res.on('data', chunk => data += chunk);
         res.on('end', () => resolve(JSON.parse(data)));
       }).on('error', reject);
     });
   }
   ```

2. 监控 API Routes（传入请求会被捕获）

3. 查看 `examples/nextjs-app/TROUBLESHOOTING.md` 获取更多信息

### 问题：Next.js instrumentation 不工作

**可能原因：**
1. 未启用 `instrumentationHook`
2. instrumentation 文件位置错误

**解决方案：**
1. 在 `next.config.js` 中启用：
   ```javascript
   module.exports = {
     experimental: {
       instrumentationHook: true,
     },
   };
   ```

2. 确保 `instrumentation.ts` 在项目根目录

3. 启动开发服务器：
   ```bash
   npm run dev
   ```

**注意**：0.2.x 版本不再需要 `--inspect` 标志。

### 问题：Express 中间件请求看不到

**可能原因：**
`install()` 在 Express 初始化之后调用。

**解决方案：**
确保在创建 Express app 之前调用 `install()`：

```typescript
import express from 'express';
import { install } from 'node-network-devtools';

// 先安装
await install();

// 再创建 app
const app = express();
```

## 性能问题

### 问题：应用变慢

**原因：**
拦截器会有轻微的性能开销。

**解决方案：**
1. 减少存储的请求数量：
   ```bash
   NND_MAX_REQUESTS=100 npx nnd your-script.js
   ```

2. 禁用 GUI（只使用 Chrome DevTools）：
   ```bash
   NND_GUI_ENABLED=false npx nnd your-script.js
   ```

3. 在生产环境禁用：
   ```typescript
   if (process.env.NODE_ENV === 'development') {
     await install();
   }
   ```

### 问题：内存占用过高

**原因：**
存储了太多请求或请求体过大。

**解决方案：**
1. 限制请求数量：
   ```typescript
   setConfig({ maxRequests: 500 });
   ```

2. 限制请求体大小：
   ```typescript
   setConfig({ maxBodySize: 512 * 1024 }); // 512KB
   ```

3. 定期清空存储：
   ```typescript
   import { getRequestStore } from 'node-network-devtools';
   
   setInterval(() => {
     getRequestStore().clear();
   }, 60000); // 每分钟清空一次
   ```

## Docker 容器问题

### 问题：在 Docker 中无法访问 GUI

**原因：**
端口未暴露或 Puppeteer 依赖缺失。

**解决方案：**

**方式 1：禁用 GUI（推荐）**
```dockerfile
FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm install

ENV NND_GUI_ENABLED=false
ENV NND_AUTO_OPEN=false

COPY . .
CMD ["node", "your-script.js"]
```

**方式 2：启用 GUI（需要安装依赖）**
```dockerfile
FROM node:18

# 安装 Chromium 和依赖
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install

# 暴露端口
EXPOSE 9229 9230

COPY . .
CMD ["node", "your-script.js"]
```

启动容器：
```bash
docker run -p 9229:9229 -p 9230:9230 your-image
```

## Windows 特定问题

### 问题：路径错误

**症状：**
```
Error: Cannot find module 'node-network-devtools\register'
```

**解决方案：**
使用正斜杠或双反斜杠：

```bash
# 正确
node --inspect -r node-network-devtools/register your-script.js

# 或
node --inspect -r node-network-devtools\\register your-script.js
```

### 问题：NODE_OPTIONS 设置无效

**解决方案：**
使用 `set` 命令：

```bash
# Windows CMD
set NODE_OPTIONS=--inspect && npm run dev

# Windows PowerShell
$env:NODE_OPTIONS="--inspect"; npm run dev

# 或使用 cross-env（跨平台）
npx cross-env NODE_OPTIONS='--inspect' npm run dev
```

## 获取帮助

如果以上方案都无法解决你的问题：

1. 💬 在 [GitHub Discussions](https://github.com/dong0926/node-network-devtools/discussions) 提问
2. 🐛 在 [GitHub Issues](https://github.com/dong0926/node-network-devtools/issues) 报告 bug
3. 📧 发送邮件到：your.email@example.com

提问时请提供：
- Node.js 版本
- 操作系统
- 完整的错误信息
- 最小可复现示例

---

更多信息请查看 [FAQ](../guides/faq.md)
