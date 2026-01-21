# 常见问题（FAQ）

## 📋 目录

- [安装和设置](#安装和设置)
- [Puppeteer 相关](#puppeteer-相关)
- [使用问题](#使用问题)
- [框架集成](#框架集成)
- [GUI 相关](#gui-相关)
- [生产环境和 CI/CD](#生产环境和-cicd)
- [性能和限制](#性能和限制)
- [迁移指南](#迁移指南)
- [故障排除](#故障排除)

## 安装和设置

### Q: 支持哪些 Node.js 版本？

**A:** Node.js >= 18.0.0。我们推荐使用 LTS 版本（18.x 或 20.x）。

### Q: 支持 CommonJS 和 ESM 吗？

**A:** 是的！从 v0.3.0 开始，包同时支持 **ESM（ECMAScript Modules）** 和 **CommonJS** 模块系统。

**ESM 项目（`"type": "module"` 或 `.mjs` 文件）：**
```typescript
import { install, getRequestStore } from '@mt0926/node-network-devtools';
import '@mt0926/node-network-devtools/register';

await install();
```

**CommonJS 项目（传统 Node.js 或 `.cjs` 文件）：**
```javascript
const { install, getRequestStore } = require('@mt0926/node-network-devtools');
require('@mt0926/node-network-devtools/register');

(async () => {
  await install();
})();
```

**TypeScript 项目：**
```typescript
import type { Config, IRequestStore } from '@mt0926/node-network-devtools';
import { install } from '@mt0926/node-network-devtools';

await install();
```

包会自动根据你的项目配置提供正确的模块格式，无需任何额外配置！

### Q: 如何在 CommonJS 项目中使用？

**A:** 直接使用 `require()` 导入即可：

```javascript
const { install, setConfig, getRequestStore } = require('@mt0926/node-network-devtools');

// 配置（可选）
setConfig({
  maxRequests: 500,
  guiEnabled: true,
});

// 安装拦截器
(async () => {
  await install();
  
  // 你的应用代码
  const http = require('http');
  http.get('https://api.example.com/data', (res) => {
    // 这个请求会被监控
  });
})();
```

**使用 `-r` 标志自动注册：**
```bash
node -r @mt0926/node-network-devtools/register your-script.js
```

### Q: 遇到 "require() of ES Module not supported" 错误怎么办？

**A:** 这个错误在 v0.3.0+ 版本中不应该出现。如果遇到此错误：

1. **确认版本**：
   ```bash
   npm list node-network-devtools
   ```

2. **升级到最新版本**：
   ```bash
   npm install node-network-devtools@latest
   ```

3. **清理缓存**：
   ```bash
   # npm
   npm cache clean --force
   
   # pnpm
   pnpm store prune
   
   # yarn
   yarn cache clean
   ```

4. **重新安装**：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

如果问题仍然存在，请查看 [故障排查文档](../troubleshooting/common-issues.md#模块系统问题) 或在 GitHub 上报告问题。

### Q: 如何在 ESM 和 CommonJS 混合项目中使用？

**A:** 包会自动处理！Node.js 的条件导出（Conditional Exports）会根据导入方式自动选择正确的模块格式：

```javascript
// 在 CommonJS 文件中
const nnd = require('@mt0926/node-network-devtools'); // 自动使用 CJS 版本

// 在 ESM 文件中
import * as nnd from '@mt0926/node-network-devtools'; // 自动使用 ESM 版本
```

无需任何配置，一切都是自动的！

### Q: 必须使用 pnpm 吗？

**A:** 不是必须的。你可以使用 npm、yarn 或 pnpm。但项目开发使用 pnpm，所以我们推荐使用 pnpm。

```bash
# npm（记得安装 Puppeteer）
npm install node-network-devtools puppeteer

# yarn
yarn add node-network-devtools puppeteer

# pnpm
pnpm add node-network-devtools puppeteer
```

### Q: 为什么需要安装 Puppeteer？

**A:** Puppeteer 用于启动极简浏览器窗口显示 GUI。如果不安装 Puppeteer：
- 会看到友好的错误提示
- 可以禁用 GUI（`NND_GUI_ENABLED=false`）
- 或手动访问 GUI URL

### Q: Puppeteer 下载太慢怎么办？

**A:** 使用国内镜像：

```bash
# 使用淘宝镜像
PUPPETEER_DOWNLOAD_HOST=https://npmmirror.com/mirrors pnpm add puppeteer

# 或跳过 Chromium 下载（使用系统浏览器）
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true pnpm add puppeteer
```

## Puppeteer 相关

### Q: Puppeteer 安装失败怎么办？

**A:** 常见解决方案：

1. **使用国内镜像**：
   ```bash
   PUPPETEER_DOWNLOAD_HOST=https://npmmirror.com/mirrors pnpm add puppeteer
   ```

2. **跳过 Chromium 下载**：
   ```bash
   PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true pnpm add puppeteer
   ```

3. **手动指定 Chromium 路径**：
   ```bash
   PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium pnpm add puppeteer
   ```

4. **在 CI 环境中**：
   ```bash
   # 完全跳过 Puppeteer
   npm install node-network-devtools --no-optional
   ```

### Q: 可以不使用 Puppeteer 吗？

**A:** 可以！有几种方式：

1. **禁用 GUI**：
   ```bash
   NND_GUI_ENABLED=false node your-script.js
   ```

2. **禁用自动打开**：
   ```bash
   NND_AUTO_OPEN=false node your-script.js
   ```
   然后手动在浏览器中访问 GUI URL

3. **在 CI 环境中**：
   工具会自动检测 CI 环境并禁用自动打开

### Q: 浏览器窗口太小/太大怎么办？

**A:** 自定义窗口大小：

```bash
# 设置窗口大小
NND_BROWSER_WIDTH=1280 NND_BROWSER_HEIGHT=720 node --import @mt0926/node-network-devtools/register your-script.js

# 或使用编程配置
setConfig({
  browserWindowSize: { width: 1280, height: 720 }
});
```

### Q: 如何自定义浏览器窗口标题？

**A:** 使用环境变量或配置：

```bash
NND_BROWSER_TITLE="我的应用网络监控" node --import @mt0926/node-network-devtools/register your-script.js
```

或：

```typescript
setConfig({
  browserWindowTitle: '我的应用网络监控'
});
```

### Q: Puppeteer 启动失败怎么办？

**A:** 检查以下几点：

1. **是否安装了 Chromium**：
   ```bash
   # 检查 Puppeteer 安装
   npx puppeteer browsers list
   ```

2. **系统依赖**（Linux）：
   ```bash
   # Ubuntu/Debian
   sudo apt-get install -y \
     libnss3 libatk1.0-0 libatk-bridge2.0-0 \
     libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
     libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
   ```

3. **权限问题**：
   ```bash
   # 添加 --no-sandbox 参数（不推荐用于生产）
   # 工具会自动添加此参数
   ```

### Q: 在 Docker 中使用 Puppeteer

**A:** 需要安装系统依赖：

```dockerfile
FROM node:18

# 安装 Chromium 依赖
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# 或者禁用 GUI
ENV NND_GUI_ENABLED=false
ENV NND_AUTO_OPEN=false
```

### Q: Next.js 中 Puppeteer 导入失败怎么办？

**A:** ✅ **从 v0.2.0 开始，库已经自动检测并处理这个问题！**

库会自动检测 Webpack 打包环境（Next.js），并在检测到时：
- 显示友好的警告信息
- 跳过 Puppeteer 导入和浏览器启动
- GUI 服务器仍然正常启动
- 你可以手动访问控制台输出的 GUI URL

**自动处理机制：**

库通过以下方式检测 Webpack 环境：
1. 检测 `__webpack_require__` 全局变量
2. 检测堆栈跟踪中的 `webpack-internal://` 或 `.next/server/` 路径
3. 检测 `process.env.NEXT_RUNTIME` 或 `__NEXT_PROCESSED_ENV` 环境变量

当检测到 Webpack 环境时，会显示如下警告：

```
[node-network-devtools] 检测到 Webpack 打包环境（Next.js/其他）

由于 Webpack 打包限制，无法自动打开浏览器。
GUI 服务器已启动，请手动访问：http://127.0.0.1:xxxxx?wsPort=xxxxx

提示：你可以在配置中设置 autoOpen: false 来禁用此警告。
```

**手动解决方案（可选）：**

如果你想完全禁用警告，可以显式设置 `autoOpen: false`：

在 `instrumentation.ts` 中：

```typescript
export async function register() {
  if (process.env.NODE_ENV === 'development') {
    const { install, startGUI } = await import('@mt0926/node-network-devtools');
    
    await install();
    
    // 显式禁用自动打开浏览器（可选，库会自动检测）
    await startGUI({ autoOpen: false });
    
    console.log('✓ GUI 已启动，请手动访问控制台中的 URL');
  }
}
```

**为什么库能自动处理？**

从 v0.2.0 开始，`browser-launcher.ts` 中添加了 `isWebpackEnvironment()` 方法：
- 在尝试导入 Puppeteer 之前，先检测是否在 Webpack 环境中
- 如果检测到 Webpack 环境，显示友好警告并静默返回
- GUI 服务器仍然正常启动，只是跳过浏览器自动打开
- 不会抛出错误，不会中断应用启动

这意味着：
- 你不需要修改任何配置
- 应用启动不会失败
- GUI 功能完全正常
- 只需手动打开浏览器访问 GUI URL

**其他可选方案：**

**方案 2：使用环境变量**

```bash
# 在 package.json 中
{
  "scripts": {
    "dev": "NND_AUTO_OPEN=false next dev"
  }
}
```

**方案 3：完全禁用 GUI**

```typescript
export async function register() {
  if (process.env.NODE_ENV === 'development') {
    const { install, setConfig } = await import('@mt0926/node-network-devtools');
    
    setConfig({
      guiEnabled: false,  // 完全禁用 GUI
      autoOpen: false,
    });
    
    await install();
  }
}
```

**相关文档：**
- [维护记录 - Next.js Puppeteer 自动检测](../maintenance/nextjs-puppeteer-auto-detection-2026-01-18.md)
- [Next.js 示例](../../examples/nextjs-app/README.md)
- [故障排查指南](../troubleshooting/common-issues.md)

**问题背景（技术细节）：**

在 v0.2.0 之前，Next.js 使用 Webpack 打包 `instrumentation.ts` 到 `.next/server/` 目录时，动态导入 Puppeteer 会失败，因为模块解析路径出错。现在库会自动检测这种情况并优雅降级。

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
import { install, setConfig } from '@mt0926/node-network-devtools';

await install();
```

## 使用问题

### Q: 为什么看不到任何请求？

**A:** 请检查以下几点：

1. **是否在发起请求前安装了拦截器？**
   ```typescript
   import { install } from '@mt0926/node-network-devtools';
   await install(); // 必须在发起请求前调用
   ```

2. **使用的是支持的 HTTP 客户端吗？**
   - ✅ http/https 模块
   - ✅ fetch API
   - ✅ undici
   - ❌ axios（暂不支持）
   - ❌ got（暂不支持）

3. **拦截器是否启用？**
   ```bash
   # 检查环境变量
   NND_INTERCEPT_HTTP=true
   NND_INTERCEPT_UNDICI=true
   ```

### Q: 如何拦截 axios 或 got 的请求？

**A:** 目前不直接支持。这些库使用了自己的请求实现。解决方案：

1. 使用 fetch API 或 http/https 模块
2. 等待未来版本的支持
3. 贡献代码添加支持 😊

### Q: 可以在生产环境使用吗？

**A:** **强烈不推荐！** 这个工具仅用于开发环境。原因：

1. **性能开销**：拦截所有请求会影响性能
2. **内存占用**：存储请求数据会占用内存
3. **安全风险**：可能暴露敏感信息
4. **Puppeteer 依赖**：生产环境不应该有浏览器依赖

**如果必须使用，请完全禁用 GUI：**

```typescript
// 条件安装
if (process.env.NODE_ENV === 'development') {
  const { install } = await import('@mt0926/node-network-devtools');
  await install();
}
```

或使用环境变量：

```bash
NODE_ENV=production \
NND_GUI_ENABLED=false \
NND_AUTO_OPEN=false \
NND_MAX_REQUESTS=100 \
node your-app.js
```

### Q: 如何脱敏更多的敏感头？

**A:** 使用配置：

```typescript
import { setConfig } from '@mt0926/node-network-devtools';

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
NND_REDACT_HEADERS=authorization,cookie,x-api-key node --import @mt0926/node-network-devtools/register your-script.js
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
import { install } from '@mt0926/node-network-devtools';

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
import { install } from '@mt0926/node-network-devtools';

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
NND_GUI_PORT=8080 node --import @mt0926/node-network-devtools/register your-script.js
```

或编程配置：

```typescript
import { setConfig } from '@mt0926/node-network-devtools';

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
NND_GUI_ENABLED=false node -r @mt0926/node-network-devtools/register your-script.js
```

这样只存储请求数据，不启动 Web GUI 和浏览器窗口。

## 生产环境和 CI/CD

### Q: 如何在生产环境中完全禁用？

**A:** 最佳实践是条件导入：

```typescript
// 方式 1：条件导入
if (process.env.NODE_ENV === 'development') {
  const { install } = await import('@mt0926/node-network-devtools');
  await install();
}

// 方式 2：使用可选依赖
try {
  if (process.env.NODE_ENV === 'development') {
    const nnd = await import('@mt0926/node-network-devtools');
    await nnd.install();
  }
} catch (err) {
  // 生产环境中可能未安装
}
```

在 `package.json` 中：

```json
{
  "devDependencies": {
    "node-network-devtools": "^0.2.0",
    "puppeteer": "^23.0.0"
  }
}
```

### Q: 在 CI/CD 环境中如何配置？

**A:** CI 环境通常不需要 GUI。配置方式：

**GitHub Actions:**

```yaml
- name: Run tests
  env:
    CI: true
    NND_GUI_ENABLED: false
    NND_AUTO_OPEN: false
  run: npm test
```

**GitLab CI:**

```yaml
test:
  variables:
    CI: "true"
    NND_GUI_ENABLED: "false"
    NND_AUTO_OPEN: "false"
  script:
    - npm test
```

**Jenkins:**

```groovy
environment {
  CI = 'true'
  NND_GUI_ENABLED = 'false'
  NND_AUTO_OPEN = 'false'
}
```

**工具会自动检测 CI 环境**（通过 `CI` 环境变量）并禁用自动打开。

### Q: Docker 容器中如何使用？

**A:** 有两种方式：

**方式 1：禁用 GUI（推荐）**

```dockerfile
FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm install

# 设置环境变量
ENV NND_GUI_ENABLED=false
ENV NND_AUTO_OPEN=false

COPY . .
CMD ["node", "your-script.js"]
```

**方式 2：启用 GUI（需要安装依赖）**

```dockerfile
FROM node:18

# 安装 Chromium 依赖
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

### Q: Kubernetes 中如何使用？

**A:** 在开发环境的 Pod 中：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app-dev
spec:
  containers:
  - name: app
    image: my-app:dev
    env:
    - name: NODE_ENV
      value: "development"
    - name: NND_GUI_ENABLED
      value: "true"
    - name: NND_AUTO_OPEN
      value: "false"  # K8s 中禁用自动打开
    ports:
    - containerPort: 9229
      name: gui
    - containerPort: 9230
      name: websocket
```

然后使用 port-forward 访问：

```bash
kubectl port-forward pod/my-app-dev 9229:9229 9230:9230
```

### Q: 如何在无头环境中使用？

**A:** 无头环境（如 CI、Docker）中禁用 GUI：

```bash
# 环境变量
export NND_GUI_ENABLED=false
export NND_AUTO_OPEN=false

# 或在代码中
setConfig({
  guiEnabled: false,
  autoOpen: false,
});
```

工具会自动检测以下环境变量并禁用 GUI：
- `CI=true`
- `CONTINUOUS_INTEGRATION=true`
- `GITHUB_ACTIONS=true`
- `GITLAB_CI=true`

### Q: 如何禁用 GUI？

**A:** 使用环境变量：

```bash
NND_GUI_ENABLED=false node --inspect -r @mt0926/node-network-devtools/register your-script.js
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
NND_MAX_REQUESTS=2000 node --import @mt0926/node-network-devtools/register your-script.js
```

或：

```typescript
setConfig({ maxRequests: 2000 });
```

注意：存储更多请求会占用更多内存。

### Q: 大请求体会被截断吗？

**A:** 是的。默认限制为 1MB。可以配置：

```bash
NND_MAX_BODY_SIZE=2097152 node --import @mt0926/node-network-devtools/register your-script.js  # 2MB
```

或：

```typescript
setConfig({ maxBodySize: 2 * 1024 * 1024 }); // 2MB
```

### Q: 如何清空已存储的请求？

**A:** 在 GUI 中点击 "Clear" 按钮，或编程方式：

```typescript
import { getRequestStore } from '@mt0926/node-network-devtools';

const store = getRequestStore();
store.clear();
```

## 迁移指南

### Q: 从 0.1.x 升级到 0.2.x 需要注意什么？

**A:** 0.2.0 版本移除了 Inspector/CDP 集成，改用 Puppeteer。主要变更：

**1. 安装 Puppeteer：**

```bash
pnpm add puppeteer
```

**2. 移除 `--inspect` 标志：**

```bash
# 旧版本（0.1.x）
node --inspect -r @mt0926/node-network-devtools/register your-script.js

# 新版本（0.2.x）
node -r @mt0926/node-network-devtools/register your-script.js
```

**3. 移除的配置项：**

- ❌ `NND_AUTO_CONNECT` - 已移除
- ❌ `NND_INSPECTOR_PORT` - 已移除
- ❌ `NND_USE_PUPPETEER` - 已移除（现在总是使用 Puppeteer）

**4. 新增的配置项：**

- ✅ `NND_BROWSER_WIDTH` - 浏览器窗口宽度（默认 800）
- ✅ `NND_BROWSER_HEIGHT` - 浏览器窗口高度（默认 600）
- ✅ `NND_BROWSER_TITLE` - 浏览器窗口标题

**5. API 变更：**

```typescript
// 移除的 API
import { getCDPBridge, isInspectorEnabled } from '@mt0926/node-network-devtools'; // ❌

// 新增的配置
import { setConfig } from '@mt0926/node-network-devtools';
setConfig({
  browserWindowSize: { width: 1024, height: 768 },
  browserWindowTitle: '我的应用',
});
```

### Q: 为什么移除了 Chrome DevTools 集成？

**A:** 主要原因：

1. **简化架构**：移除了复杂的 CDP 桥接代码
2. **更好的体验**：Puppeteer 提供更可控的浏览器窗口
3. **减少依赖**：不再依赖 Node.js Inspector
4. **更快启动**：无需等待 Inspector 连接

**如果你需要 Chrome DevTools：**
- 可以继续使用 0.1.x 版本
- 或在浏览器中直接访问 GUI URL

### Q: 迁移后 GUI 无法打开？

**A:** 检查以下几点：

1. **是否安装了 Puppeteer？**
   ```bash
   pnpm add puppeteer
   ```

2. **是否移除了 `--inspect` 标志？**
   ```bash
   # 正确
   node your-script.js
   
   # 错误（不再需要）
   node --inspect your-script.js
   ```

3. **是否更新了配置？**
   ```typescript
   // 移除旧配置
   setConfig({
     autoConnect: true,  // ❌ 已移除
     inspectorPort: 9229, // ❌ 已移除
   });
   
   // 使用新配置
   setConfig({
     browserWindowSize: { width: 800, height: 600 }, // ✅
   });
   ```

### Q: 迁移后性能有变化吗？

**A:** 性能影响：

- **启动时间**：略有增加（Puppeteer 启动需要 1-3 秒）
- **运行时性能**：基本相同
- **内存占用**：略有增加（Puppeteer 浏览器进程）

**优化建议：**

```bash
# 开发时使用
NND_AUTO_OPEN=true

# 不需要 GUI 时禁用
NND_GUI_ENABLED=false
```

### Q: 可以同时使用旧版本和新版本吗？

**A:** 不建议。选择一个版本：

- **0.1.x**：如果需要 Chrome DevTools 集成
- **0.2.x**：如果想要更简单的架构和更好的 GUI 体验

**迁移步骤：**

1. 更新 package.json：
   ```json
   {
     "dependencies": {
       "@mt0926/node-network-devtools": "^0.2.0",
       "puppeteer": "^23.0.0"
     }
   }
   ```

2. 安装依赖：
   ```bash
   pnpm install
   ```

3. 更新代码（移除 `--inspect`，更新配置）

4. 测试应用

### Q: 迁移后遇到问题怎么办？

**A:** 

1. **查看迁移文档**：
   - `CHANGELOG.md` - 详细的变更记录
   - `docs/maintenance/remove-inspector-puppeteer-only-2026-01-18.md` - 技术细节

2. **回退到旧版本**：
   ```bash
   pnpm add node-network-devtools@0.1.x
   ```

3. **报告问题**：
   - GitHub Issues: https://github.com/dong0926/node-network-devtools/issues
   - 标题格式：`[Migration] 问题描述`

## 故障排除

### Q: 报错 "Cannot find module '@mt0926/node-network-devtools'"

**A:** 确保已安装：

```bash
pnpm install node-network-devtools
```

如果使用 `-r` 标志，确保路径正确：

```bash
node --inspect -r @mt0926/node-network-devtools/register your-script.js
```

### Q: 报错 "Inspector is not enabled"

**A:** 这个错误在 0.2.x 版本中不应该出现。如果看到此错误：

1. **确认版本**：
   ```bash
   npm list node-network-devtools
   ```

2. **如果是 0.1.x**：需要使用 `--inspect` 标志
   ```bash
   node --inspect your-script.js
   ```

3. **如果是 0.2.x**：不需要 `--inspect`，直接运行
   ```bash
   node your-script.js
   ```

4. **升级到最新版本**：
   ```bash
   pnpm add node-network-devtools@latest puppeteer
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
   NND_WS_PORT=9999 node --import @mt0926/node-network-devtools/register your-script.js
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

4. **Puppeteer 版本问题**
   ```bash
   # 重新安装 Puppeteer
   pnpm remove puppeteer
   pnpm add puppeteer@latest
   ```

### Q: 报错 "Puppeteer not installed"

**A:** 安装 Puppeteer：

```bash
pnpm add puppeteer

# 或使用国内镜像
PUPPETEER_DOWNLOAD_HOST=https://npmmirror.com/mirrors pnpm add puppeteer
```

如果不想使用 Puppeteer，禁用 GUI：

```bash
NND_GUI_ENABLED=false node your-script.js
```

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
node --inspect -r @mt0926/node-network-devtools/register your-script.js

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
