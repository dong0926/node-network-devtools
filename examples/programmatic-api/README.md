# 编程式 API 示例

演示如何通过编程方式使用 node-network-devtools，而不是通过 CLI 或 `-r` 标志。

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

## 功能说明

### 自定义配置

```javascript
import { setConfig } from 'node-network-devtools';

setConfig({
  maxRequests: 100,           // 最大存储请求数
  maxBodySize: 256 * 1024,    // 最大 body 大小
  redactHeaders: ['authorization', 'cookie', 'x-api-key'],
});
```

### 手动安装拦截器

```javascript
import { install } from 'node-network-devtools';

await install();
```

### 查询存储的请求

```javascript
import { getRequestStore } from 'node-network-devtools';

const store = getRequestStore();

// 获取所有请求
const all = store.getAll();

// 按条件查询
const posts = store.query({ method: 'POST' });
const userApi = store.query({ urlPattern: /users/ });
```

### GUI 相关配置

```javascript
import { setConfig } from 'node-network-devtools';

setConfig({
  guiEnabled: true,           // 启用 GUI
  guiPort: 8080,              // GUI 端口（可选，默认自动获取）
  wsPort: 8081,               // WebSocket 端口（可选，默认自动获取）
  autoOpen: true,             // 自动打开浏览器
});
```

或通过环境变量配置：

```bash
NND_GUI_ENABLED=true NND_GUI_PORT=8080 node index.js
```

## 使用场景

- 需要在代码中动态控制拦截器
- 需要自定义配置
- 需要在代码中查询和分析请求数据
- 集成到现有的监控系统
