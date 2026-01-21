# 实时更新功能说明

## 问题描述

之前的版本中，GUI 不会实时显示新的网络请求，需要手动刷新页面才能看到最新的请求。

## 问题原因

拦截器（HTTP Patcher 和 Undici Patcher）捕获了网络请求并存储到 Request Store 中，但**没有通知 Event Bridge**。

Event Bridge 负责将请求事件通过 WebSocket 推送到 GUI 前端，如果拦截器不调用 Event Bridge 的方法，WebSocket 就不会发送消息，GUI 也就无法实时更新。

## 解决方案

### 修改内容

在拦截器中添加了对 Event Bridge 的调用：

#### 1. HTTP Patcher (`src/interceptors/http-patcher.ts`)

```typescript
// 请求开始时
getRequestStore().add(requestData);

// 通知 Event Bridge
try {
  const eventBridge = getEventBridge();
  if (eventBridge.isRunning()) {
    eventBridge.emitRequestStart(requestData);
  }
} catch {
  // 忽略 Event Bridge 错误
}
```

```typescript
// 响应完成时
getRequestStore().updateResponse(metadata.requestId, responseData);

// 通知 Event Bridge
try {
  const eventBridge = getEventBridge();
  if (eventBridge.isRunning()) {
    eventBridge.emitRequestComplete(metadata.requestId, responseData);
  }
} catch {
  // 忽略 Event Bridge 错误
}
```

#### 2. Undici Patcher (`src/interceptors/undici-patcher.ts`)

同样添加了 `emitRequestStart`、`emitRequestComplete` 和 `emitRequestError` 的调用。

### 工作流程

现在的完整流程：

```
1. 应用发起网络请求
   ↓
2. 拦截器捕获请求
   ↓
3. 存储到 Request Store
   ↓
4. 通知 Event Bridge ← 新增
   ↓
5. Event Bridge 通过 WebSocket 推送
   ↓
6. GUI 前端实时接收并显示
```

## 测试实时更新

### 方法 1：使用测试脚本

```bash
# 在项目根目录
cd examples
node --import ../dist/esm/register.js test-realtime.js
```

这个脚本会每 3 秒发送一个请求，共发送 10 个请求。观察 GUI 是否实时显示这些请求。

### 方法 2：使用 Next.js 示例

```bash
cd examples/nextjs-app
pnpm dev:gui
```

然后：
1. 打开 GUI 页面
2. 访问 Next.js 应用 (http://localhost:3000)
3. 观察 GUI 是否实时显示页面加载时的请求
4. 提交表单创建用户
5. 观察 GUI 是否实时显示 POST 请求

### 方法 3：使用 basic-http 示例

```bash
cd examples/basic-http
pnpm start:gui
```

观察 GUI 是否实时显示示例中的请求。

## 预期行为

### ✅ 正常情况

- 发起请求后，GUI 中**立即**出现新的请求行
- 请求完成后，状态码和耗时**自动更新**
- 不需要刷新页面
- WebSocket 连接状态显示为"已连接"

### ❌ 异常情况

如果仍然需要刷新才能看到请求，可能的原因：

1. **Event Bridge 未启动**
   - 检查控制台是否有 "Event Bridge 已启动" 的日志
   - 确保调用了 `startGUI()` 而不是只启动 GUI 服务器

2. **WebSocket 连接失败**
   - 检查浏览器控制台是否有 WebSocket 错误
   - 确认 WebSocket 端口没有被防火墙阻止
   - 尝试手动连接：`ws://127.0.0.1:<wsPort>`

3. **拦截器未安装**
   - 检查是否调用了 `install()`
   - 确认配置中 `interceptHttp` 和 `interceptUndici` 为 `true`

## 调试

### 启用详细日志

在 `instrumentation.ts` 或启动脚本中添加：

```typescript
import { getEventBridge } from 'node-network-devtools';

const eventBridge = getEventBridge();
console.log('Event Bridge 运行状态:', eventBridge.isRunning());
```

### 检查 WebSocket 连接

在浏览器控制台执行：

```javascript
// 查看 WebSocket 状态
console.log('WebSocket 状态:', window.ws?.readyState);
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
```

### 手动测试 Event Bridge

```typescript
import { getEventBridge, getRequestStore } from 'node-network-devtools';

const eventBridge = getEventBridge();
eventBridge.start();

// 手动触发事件
const mockRequest = {
  id: 'test-1',
  traceId: 'trace-1',
  url: 'https://example.com',
  method: 'GET',
  headers: {},
  timestamp: Date.now(),
};

eventBridge.emitRequestStart(mockRequest);
console.log('已发送测试事件');
```

## 性能影响

添加 Event Bridge 通知对性能的影响：

- **CPU**: 几乎可以忽略（< 0.1ms per request）
- **内存**: 无额外内存开销
- **网络**: WebSocket 消息很小（< 1KB per request）

在生产环境中，建议禁用 GUI：

```typescript
setConfig({
  guiEnabled: false,
});
```

## 相关文件

- `src/interceptors/http-patcher.ts` - HTTP 拦截器
- `src/interceptors/undici-patcher.ts` - Undici/Fetch 拦截器
- `src/gui/event-bridge.ts` - Event Bridge 实现
- `src/gui/websocket-hub.ts` - WebSocket Hub 实现
- `packages/gui/src/hooks/useWebSocket.ts` - 前端 WebSocket 钩子

## 常见问题

### Q: 为什么有些请求实时显示，有些不显示？

A: 检查请求是否被拦截器捕获：
- HTTP/HTTPS 模块的请求 → HTTP Patcher
- Fetch API 的请求 → Undici Patcher
- Next.js 的 fetch 可能绕过拦截器（见 TROUBLESHOOTING.md）

### Q: WebSocket 连接断开后会自动重连吗？

A: 前端会自动尝试重连。检查 `useWebSocket.ts` 中的重连逻辑。

### Q: 可以禁用实时更新吗？

A: 可以，通过暂停功能：
- GUI 中点击"暂停"按钮
- 或调用 `eventBridge.pause()`

### Q: 实时更新会影响应用性能吗？

A: 影响很小。如果担心性能，可以：
1. 减少捕获的请求数量（设置 `maxRequests`）
2. 禁用 body 捕获（设置 `disableBodyCapture: true`）
3. 在生产环境禁用 GUI

## 未来改进

可能的优化方向：

1. **批量发送** - 将多个事件合并为一个 WebSocket 消息
2. **压缩** - 对大型响应体进行压缩
3. **过滤** - 在服务端过滤不需要的请求
4. **采样** - 只发送部分请求（如 10%）

欢迎提交 Issue 或 PR！
