# 快速启动指南

## 前置要求

⚠️ **重要**：首次运行前，必须先构建主项目（包括 GUI）：

```bash
# 在项目根目录执行
cd ../..
pnpm build
cd examples/nextjs-app
```

如果看到 GUI 页面 404 错误或静态资源缺失，说明 GUI 没有构建。

## Windows 用户

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动开发服务器

```bash
# 普通模式（控制台日志）
pnpm dev

# Web GUI 模式（推荐）- 会自动打开浏览器显示网络请求面板
pnpm dev:gui
```

**注意**：使用 `pnpm dev:gui` 时，会自动启动 GUI 服务器并打开浏览器。

### 3. 访问应用

打开浏览器访问：http://localhost:3000

### 4. 查看网络请求

#### 方式一：Web GUI（推荐）

如果使用 `pnpm dev:gui`，会自动启动 GUI 服务器并打开浏览器显示网络请求面板。

你会看到类似这样的输出：
```
✓ [node-network-devtools] 已在 Next.js 服务端初始化
✓ [node-network-devtools] Web GUI 已启动
  GUI URL: http://127.0.0.1:9230
  GUI Port: 9230
  WebSocket Port: 9231
```

浏览器会自动打开并显示网络请求监控界面。

**📖 详细说明**：
- [GUI-DEMO.md](./GUI-DEMO.md) - 查看 GUI 中会显示哪些请求
- [GUI-LAYOUT.md](./GUI-LAYOUT.md) - 了解 GUI 界面布局和功能

#### 方式二：Chrome DevTools

1. 打开 Chrome 浏览器
2. 访问 `chrome://inspect`
3. 点击 "Configure..." 按钮
4. 确保 `localhost:9229` 在列表中
5. 在 "Remote Target" 下找到 Next.js 进程
6. 点击 "inspect" 打开 DevTools
7. 查看 Console 面板的网络请求日志

## 常见问题

### Q: 看到 "NODE_OPTIONS is not recognized" 错误？

这个问题已经通过使用 `cross-env` 解决。确保运行了 `pnpm install` 安装所有依赖。

### Q: GUI 没有自动打开浏览器？

在 Windows 下可能会遇到权限问题。查看控制台输出，找到 GUI URL：
```
[node-network-devtools] GUI 服务器已启动: http://127.0.0.1:54584?wsPort=54585
```

手动复制这个 URL 到浏览器中打开即可。

### Q: 端口 3000 被占用？

修改 package.json 中的启动命令：

```json
"dev": "cross-env NODE_OPTIONS=--inspect next dev -p 3001"
```

### Q: 如何停止开发服务器？

在终端按 `Ctrl + C`

## 测试功能

启动后，页面会展示以下功能：

1. **Server Component 请求** - 自动加载用户和文章列表
2. **Server Actions** - 填写表单创建/删除用户
3. **API Routes** - 点击链接访问 `/api/users`

所有这些操作的网络请求都会被 node-network-devtools 捕获并显示。

## 下一步

- 查看 [README.md](./README.md) 了解详细文档
- 查看 [instrumentation.ts](./instrumentation.ts) 了解初始化配置
- 查看 [app/page.tsx](./app/page.tsx) 了解 Server Component 用法
- 查看 [app/actions/user-actions.ts](./app/actions/user-actions.ts) 了解 Server Actions 用法
