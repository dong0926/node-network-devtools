# Express 服务器示例

演示在 Web 服务器中使用 node-network-devtools 监听服务器发出的外部 API 请求。

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

## 测试接口

启动后访问：

- http://localhost:3000/ - 首页
- http://localhost:3000/api/weather - 获取天气（调用 httpbin.org）
- http://localhost:3000/api/github - 获取 GitHub 用户信息

使用 curl 测试 POST：

```bash
curl -X POST http://localhost:3000/api/webhook
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

1. 打开 Chrome 浏览器
2. 访问 `chrome://inspect`
3. 点击 "Open dedicated DevTools for Node"
4. 切换到 Network 面板
5. 访问上述接口，观察服务器发出的外部请求

## 使用场景

- 监控 BFF（Backend for Frontend）层的 API 调用
- 调试微服务间的通信
- 追踪第三方 API 调用
