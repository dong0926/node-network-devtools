# Axios + 代理 + node-network-devtools 冲突问题

## 问题描述

当同时满足以下条件时，会出现 URL 重复拼接错误：

1. ✅ 使用 `node-network-devtools`
2. ✅ 使用 `axios` 发起请求
3. ✅ 配置了 HTTP 代理（`HTTP_PROXY` 或 `HTTPS_PROXY`）

**错误**：
```
TypeError: Invalid URL
input: 'http://127.0.0.1:7897http://api.pl2w.top/...'
```

## 根本原因

`@mswjs/interceptors`（node-network-devtools 使用的 HTTP 拦截库）在拦截 axios 请求时，干扰了 axios 的代理处理逻辑，导致：

1. axios 检测到代理配置
2. axios 准备将请求发送到代理
3. `@mswjs/interceptors` 拦截了底层的 HTTP 请求
4. 拦截器看到的 URL 已经被 axios 修改过（包含代理地址）
5. 某个环节错误地拼接了 URL

## 解决方案

### 方案 1：禁用 HTTP 拦截器（推荐）

如果你主要使用 axios，可以禁用 `http-patcher`，只使用 `undici-patcher`：

```typescript
// instrumentation.ts
import { setConfig, install } from '@mt0926/node-network-devtools';

setConfig({
  interceptHttp: false,    // 禁用 HTTP 拦截器（避免干扰 axios）
  interceptUndici: true,   // 保留 undici 拦截器（用于 Next.js fetch）
});

await install();
```

**优点**：
- 简单直接
- 不影响 Next.js 的 fetch 请求监控
- axios 请求不会被拦截，避免冲突

**缺点**：
- 无法监控 axios 请求

### 方案 2：使用环境变量

```bash
# 禁用 HTTP 拦截器
NND_INTERCEPT_HTTP=false pnpm dev
```

### 方案 3：忽略特定 URL

如果只有特定的 API 出现问题，可以配置忽略规则：

```typescript
// instrumentation.ts
import { setConfig, install } from '@mt0926/node-network-devtools';

setConfig({
  ignoreUrls: [
    /api\.pl2w\.top/,  // 忽略这个域名的请求
    /\/fulu-page-cloud\//,  // 或者忽略特定路径
  ],
});

await install();
```

### 方案 4：移除代理配置

如果代理不是必需的，可以临时禁用：

```bash
# 临时禁用代理
unset HTTP_PROXY
unset HTTPS_PROXY

# Windows
set HTTP_PROXY=
set HTTPS_PROXY=

# 然后启动
pnpm dev
```

### 方案 5：在 axios 中配置代理（而不是环境变量）

不使用环境变量，而是在 axios 配置中直接设置代理：

```typescript
// baseFetch.ts 或 axios 配置文件
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

const axiosInstance = axios.create({
  // 不要使用 proxy 选项，使用 httpAgent 和 httpsAgent
  httpAgent: new HttpsProxyAgent('http://127.0.0.1:7897'),
  httpsAgent: new HttpsProxyAgent('http://127.0.0.1:7897'),
});

export default axiosInstance;
```

然后禁用环境变量：

```bash
unset HTTP_PROXY
unset HTTPS_PROXY
```

### 方案 6：切换到原生 fetch

将 axios 替换为 Node.js 原生 fetch：

```typescript
// baseFetch.ts
export async function finalFetch<R>(options: FetchOptions): Promise<R> {
  // 使用原生 fetch（会被 undici-patcher 正确拦截）
  const response = await fetch(options.url, {
    method: options.method || 'GET',
    headers: options.headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}
```

**优点**：
- 原生 fetch 与 node-network-devtools 完全兼容
- 不需要额外的依赖
- 代理处理由 Node.js 内部完成

## 推荐配置

### 对于 Next.js + axios 项目

```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { install, setConfig } = await import('@mt0926/node-network-devtools');
    
    setConfig({
      // 禁用 HTTP 拦截器，避免干扰 axios
      interceptHttp: false,
      
      // 保留 undici 拦截器，监控 Next.js 的 fetch
      interceptUndici: true,
      
      // 其他配置
      maxRequests: 500,
      redactHeaders: ['authorization', 'cookie', 'x-api-key'],
    });
    
    await install();
    
    console.log('✓ node-network-devtools 已初始化');
    console.log('  - HTTP 拦截器: 禁用（避免 axios 冲突）');
    console.log('  - Undici 拦截器: 启用（监控 Next.js fetch）');
  }
}
```

### 对于纯 axios 项目

如果你的项目主要使用 axios，建议：

1. **不使用 node-network-devtools**（因为无法监控 axios）
2. **或者切换到原生 fetch**（方案 6）

## 验证修复

### 步骤 1：应用配置

选择上述方案之一并应用。

### 步骤 2：清理缓存

```bash
rm -rf .next node_modules
pnpm install
```

### 步骤 3：启动并测试

```bash
pnpm dev
```

### 步骤 4：检查日志

应该看到：
- ✅ 没有 URL 重复拼接错误
- ✅ axios 请求正常工作
- ✅ Next.js fetch 请求仍然被监控（如果使用方案 1）

## 技术细节

### 为什么会发生冲突？

1. **axios 的代理处理**：
   - axios 检测到 `HTTP_PROXY` 环境变量
   - axios 使用 `http-proxy-agent` 或类似库
   - axios 修改底层的 HTTP 请求，将目标 URL 作为路径发送到代理

2. **@mswjs/interceptors 的拦截**：
   - 拦截器在 Node.js HTTP 模块层面工作
   - 拦截器看到的是 axios 已经修改过的请求
   - 拦截器可能错误地解析或重新构建 URL

3. **结果**：
   - URL 被重复拼接
   - 或者代理配置被破坏

### 为什么 undici-patcher 不受影响？

- `undici-patcher` 拦截的是 undici/fetch API
- axios 不使用 undici，使用的是 Node.js 原生 `http/https` 模块
- 所以 `undici-patcher` 不会干扰 axios

### 为什么禁用 HTTP 拦截器有效？

- 禁用 `http-patcher` 后，`@mswjs/interceptors` 不会被安装
- axios 可以正常使用 Node.js 原生 HTTP 模块
- 代理处理不会被干扰

## 长期解决方案

### 选项 A：改进 http-patcher

在 `http-patcher` 中添加对代理场景的特殊处理：

```typescript
// 检测是否是代理请求
if (request.headers.get('proxy-connection') || 
    request.url.startsWith('http://') && origin.includes('127.0.0.1')) {
  // 跳过拦截，让 axios 正常处理
  return;
}
```

### 选项 B：提供 axios 适配器

创建一个专门的 axios 适配器：

```typescript
import { AxiosAdapter } from 'axios';

export function createNodeNetworkDevtoolsAdapter(): AxiosAdapter {
  // 自定义适配器，正确处理代理和监控
}
```

### 选项 C：文档说明

在文档中明确说明：
- node-network-devtools 与 axios + 代理的兼容性问题
- 推荐使用原生 fetch 而不是 axios
- 或者禁用 HTTP 拦截器

## 相关 Issue

如果这是一个常见问题，建议：

1. 在 README 中添加"已知问题"部分
2. 提供 axios 用户的配置示例
3. 考虑添加自动检测和警告

## 总结

**最简单的解决方案**：

```typescript
// instrumentation.ts
setConfig({
  interceptHttp: false,  // 禁用 HTTP 拦截器
});
```

这样可以：
- ✅ 避免与 axios 冲突
- ✅ 保留 Next.js fetch 监控
- ✅ 不需要修改业务代码

**最佳长期方案**：

将 axios 替换为原生 fetch，享受：
- ✅ 完整的监控支持
- ✅ 更好的性能
- ✅ 更少的依赖
- ✅ 与 Next.js 更好的集成
