# Fetch API 示例

演示如何使用 node-network-devtools 监听 Node.js 原生 `fetch` API 的请求。

## ⚠️ 注意事项

**本工具仅用于开发环境**，不推荐在生产环境使用。

## 前置要求

- Node.js >= 18.0.0
- Puppeteer（会自动安装）

## 安装

```bash
pnpm install
```

这会自动安装 Puppeteer 和其他依赖。

## 运行

```bash
pnpm start
```

工具会自动：
1. 启动 GUI 服务器
2. 打开极简浏览器窗口（无地址栏、工具栏）
3. 实时显示网络请求

## 配置选项

### 禁用自动打开浏览器

```bash
NND_AUTO_OPEN=false pnpm start
```

然后手动访问显示的 URL。

### 自定义窗口大小

```bash
NND_BROWSER_WIDTH=1920 NND_BROWSER_HEIGHT=1080 pnpm start
```

### 完全禁用 GUI（生产环境）

```bash
NND_GUI_ENABLED=false pnpm start
```

## 查看结果

启动后会自动打开极简浏览器窗口，显示：
- 请求列表（状态、方法、URL、大小、耗时）
- 请求详情（Headers、Payload、Response、Timing）
- 过滤和搜索功能

## 示例请求

- `GET /posts/1` - 获取单个帖子
- `POST /posts` - 创建新帖子（带 Authorization 头）
- 并发请求 - 同时获取用户和评论
