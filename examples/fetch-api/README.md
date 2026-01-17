# Fetch API 示例

演示如何使用 node-network-devtools 监听 Node.js 原生 `fetch` API 的请求。

## 运行方式

### 使用 Web GUI（推荐）

```bash
npx node-network-devtools --gui index.js
```

启动后会自动打开浏览器，显示网络请求面板。

### 使用 CLI

```bash
pnpm start
```

## 查看结果

### 使用 Web GUI（推荐）

启动时添加 `--gui` 选项，会自动打开浏览器显示：
- 请求列表（状态、方法、URL、大小、耗时）
- 请求详情（Headers、Payload、Response、Timing）
- 过滤和搜索功能

禁用自动打开浏览器：

```bash
npx node-network-devtools --gui --no-open index.js
```

### 使用 Chrome DevTools

1. 启动后，打开 Chrome 浏览器
2. 访问 `chrome://inspect`
3. 点击 "Open dedicated DevTools for Node"
4. 切换到 Network 面板

## 示例请求

- `GET /posts/1` - 获取单个帖子
- `POST /posts` - 创建新帖子（带 Authorization 头）
- 并发请求 - 同时获取用户和评论
