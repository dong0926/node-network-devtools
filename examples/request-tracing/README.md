# 请求追踪示例

演示如何使用 `runWithTrace` 和 `TraceID` 关联同一业务流程中的多个请求。

## 运行方式

### 使用 Web GUI（推荐）

使用 `register` 注入启动：

**ESM:**
```bash
node --import node-network-devtools/register index.js
```

**CommonJS:**
```bash
node -r node-network-devtools/register index.js
```

启动后会自动打开浏览器，显示网络请求面板。

### 使用脚本启动

```bash
pnpm start
```

## 查看结果

### 使用 Web GUI（推荐）

启动示例后，会自动打开浏览器显示：
- 请求列表（状态、方法、URL、大小、耗时）
- 请求详情（Headers、Payload、Response、Timing）
- 过滤和搜索功能

禁用自动打开浏览器：

```bash
NND_AUTO_OPEN=false node --import node-network-devtools/register index.js
```

## 功能说明

### TraceID 追踪

使用 `runWithTrace` 包裹一组相关的请求，它们会自动关联到同一个 TraceID：

```javascript
import { runWithTrace, getCurrentTraceId } from 'node-network-devtools';

await runWithTrace('user-login', async () => {
  // 这些请求都会关联到 'user-login' TraceID
  await fetch('/api/auth');
  await fetch('/api/user');
  await fetch('/api/permissions');
});
```

### 查询关联请求

```javascript
import { getRequestStore } from 'node-network-devtools';

const store = getRequestStore();
const requests = store.getByTraceId('user-login');
console.log(`找到 ${requests.length} 个关联请求`);
```

## 使用场景

- 用户登录流程追踪
- 订单处理流程追踪
- 数据同步任务追踪
- 微服务调用链追踪
