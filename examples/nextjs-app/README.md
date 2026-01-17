# Next.js App Router 示例

演示如何在 Next.js App Router 应用中使用 node-network-devtools 监听网络请求。

## 📚 文档导航

- **[QUICKSTART.md](./QUICKSTART.md)** - 快速启动指南（推荐新手）
- **[GUI-DEMO.md](./GUI-DEMO.md)** - GUI 中显示的请求演示
- **[GUI-LAYOUT.md](./GUI-LAYOUT.md)** - GUI 界面布局说明
- **[REALTIME-UPDATE.md](./REALTIME-UPDATE.md)** - 实时更新功能说明
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - 故障排查（重要！）
- **[README-FILES.md](./README-FILES.md)** - 完整文档索引

⚠️ **重要提示**：Next.js 14+ 使用了自己的 fetch 实现，可能无法被 node-network-devtools 拦截。请查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 了解详情和解决方案。

---

## 功能特性

- ✅ Server Components 中的 fetch 请求监听
- ✅ Server Actions 中的网络请求监听
- ✅ Route Handlers (API Routes) 监听
- ✅ Next.js Data Cache 状态追踪
- ✅ Request Memoization 检测
- ✅ 缓存标签 (Cache Tags) 显示

## 快速开始

### 0. 构建项目（首次运行必须）

```bash
# 在项目根目录
pnpm install
pnpm build  # 构建核心模块和 GUI
```

**注意**：如果 GUI 页面显示 404 或静态资源缺失，请运行 `pnpm build:gui`。

详细构建说明请查看 [BUILD.md](../../BUILD.md)。

### 1. 安装依赖

```bash
pnpm install
```

**注意**：项目使用 `cross-env` 来确保跨平台兼容性（Windows/Linux/macOS）。

### 2. 启动开发服务器

使用控制台日志模式：

```bash
pnpm dev
```

使用 Web GUI 模式（推荐）：

```bash
pnpm dev:gui
```

### 3. 访问应用

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 4. 查看网络请求

#### 方式一：Web GUI（推荐）

如果使用 `pnpm dev:gui` 启动，会自动启动 GUI 服务器并打开浏览器显示网络请求面板。

启动后会看到：
```
✓ [node-network-devtools] 已在 Next.js 服务端初始化
✓ [node-network-devtools] Web GUI 已启动
  GUI URL: http://127.0.0.1:9230
  GUI Port: 9230
  WebSocket Port: 9231
```

浏览器会自动打开并显示网络请求监控界面。

**📖 查看 [GUI-DEMO.md](./GUI-DEMO.md) 了解 GUI 中会显示哪些请求以及如何使用各项功能。**

#### 方式二：Chrome DevTools

1. 打开 Chrome 浏览器
2. 访问 `chrome://inspect`
3. 在 "Remote Target" 下找到 Next.js 进程
4. 点击 "inspect" 打开 DevTools
5. 查看 Console 面板的网络请求日志

注意：Network 面板目前还不支持显示 Node.js 网络事件。

## 项目结构

```
nextjs-app/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页（Server Component）
│   ├── api/
│   │   └── users/
│   │       └── route.ts    # API Route Handler
│   └── actions/
│       └── user-actions.ts # Server Actions
├── instrumentation.ts      # node-network-devtools 初始化
├── next.config.js          # Next.js 配置
├── tsconfig.json
└── package.json
```

## 示例说明

### Server Component 请求

`app/page.tsx` 展示了在 Server Component 中使用 fetch：

```typescript
// 带缓存的请求
const users = await fetch('https://jsonplaceholder.typicode.com/users', {
  next: { revalidate: 60 } // 60秒后重新验证
});

// 不缓存的请求
const posts = await fetch('https://jsonplaceholder.typicode.com/posts', {
  cache: 'no-store'
});
```

### Server Actions

`app/actions/user-actions.ts` 展示了在 Server Actions 中发起请求：

```typescript
'use server';

export async function createUser(formData: FormData) {
  const response = await fetch('https://jsonplaceholder.typicode.com/users', {
    method: 'POST',
    body: JSON.stringify({ name: formData.get('name') })
  });
  return response.json();
}
```

### API Route Handler

`app/api/users/route.ts` 展示了在 Route Handler 中处理请求：

```typescript
export async function GET() {
  const response = await fetch('https://jsonplaceholder.typicode.com/users');
  const data = await response.json();
  return Response.json(data);
}
```

## 配置说明

### instrumentation.ts

这是 Next.js 的 instrumentation 钩子，用于在服务端启动时初始化 node-network-devtools：

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { install } = await import('node-network-devtools');
    await install();
  }
}
```

### next.config.js

需要启用 instrumentation 功能：

```javascript
module.exports = {
  experimental: {
    instrumentationHook: true,
  },
};
```

## 环境变量

可以通过环境变量配置 node-network-devtools：

```bash
# 启用 Web GUI（推荐使用 pnpm dev:gui）
cross-env NODE_OPTIONS=--inspect NND_GUI_ENABLED=true next dev

# 指定 GUI 端口
cross-env NODE_OPTIONS=--inspect NND_GUI_ENABLED=true NND_GUI_PORT=9229 next dev

# 禁用自动打开浏览器
cross-env NODE_OPTIONS=--inspect NND_GUI_ENABLED=true NND_AUTO_OPEN=false next dev
```

**提示**：在 Windows 下需要使用 `cross-env` 来设置环境变量。

## Next.js 特有功能

### 缓存状态追踪

node-network-devtools 会自动检测和显示 Next.js 的缓存状态：

- `HIT` - 缓存命中
- `MISS` - 缓存未命中
- `STALE` - 缓存过期
- `REVALIDATED` - 已重新验证

### 缓存配置显示

会显示 fetch 请求的缓存配置：

- `revalidate` - 重新验证时间（秒）
- `tags` - 缓存标签
- `cache` - 缓存模式（force-cache, no-store 等）

### 路由信息

显示请求来源的路由和类型：

- `server-component` - Server Component
- `server-action` - Server Action
- `route-handler` - Route Handler
- `middleware` - Middleware

## 常见问题

### Q: Windows 下运行报错？

项目已使用 `cross-env` 确保跨平台兼容。如果仍有问题，请确保已安装依赖：

```bash
pnpm install
```

### Q: GUI 没有自动打开浏览器？

在 Windows 下可能会遇到权限问题导致浏览器无法自动打开。不用担心，GUI 服务器已经启动了！

查看控制台输出，找到类似这样的信息：
```
[node-network-devtools] GUI 服务器已启动: http://127.0.0.1:54584?wsPort=54585
```

手动复制这个 URL 到浏览器中打开即可。

### Q: 为什么需要 --inspect 标志？

node-network-devtools 使用 Node.js Inspector API 来捕获网络请求，需要启用 inspector。

### Q: 会影响性能吗？

在开发环境影响很小。不建议在生产环境使用。

### Q: 支持 Pages Router 吗？

支持！instrumentation.ts 对 App Router 和 Pages Router 都有效。

### Q: 可以监听外部 API 调用吗？

可以！所有通过 fetch、http、https 模块的请求都会被捕获。

## 相关资源

- [Next.js Instrumentation 文档](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
- [Next.js Data Cache 文档](https://nextjs.org/docs/app/building-your-application/caching)
- [node-network-devtools 文档](../../README.md)
