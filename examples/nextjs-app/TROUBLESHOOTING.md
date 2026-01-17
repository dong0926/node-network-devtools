# Next.js 示例故障排查

## 问题 1：Webpack 警告和错误

### 症状

在启动 Next.js 开发服务器时，看到以下警告或错误：

```
⚠ Critical dependency: the request of a dependency is an expression
Import trace: import-fresh/index.js → cosmiconfig → puppeteer

Module not found: Can't resolve 'source-map-support' in 'typescript/lib'
```

### 原因

Next.js 的 Webpack 在客户端打包时，试图打包服务端专用的依赖（如 `puppeteer`、`typescript`），导致警告和错误。

### 解决方案

在 `next.config.js` 中配置 Webpack，排除这些服务端专用依赖：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 客户端打包：排除服务端专用的包
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        puppeteer: false,
        'source-map-support': false,
      };

      // 忽略可选依赖的警告
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { module: /node_modules\/puppeteer/ },
        { module: /node_modules\/import-fresh/ },
        { module: /node_modules\/cosmiconfig/ },
      ];
    }

    return config;
  },
};

module.exports = nextConfig;
```

**详细说明**：查看 [../../NEXTJS-WEBPACK-WARNINGS.md](../../NEXTJS-WEBPACK-WARNINGS.md) 了解完整的问题分析和解决方案。

---

## 问题 2：GUI 中看不到 Next.js 的 fetch 请求

### 原因分析

Next.js 14+ 使用了自己修改过的 `fetch` 实现来支持以下特性：
- Data Cache（数据缓存）
- Request Memoization（请求记忆化）
- Revalidation（重新验证）
- Cache Tags（缓存标签）

Next.js 的 `fetch` 实现可能绕过了 undici 的全局 dispatcher，导致 node-network-devtools 无法拦截这些请求。

### 解决方案

#### 方案 1：使用原生 http/https 模块（推荐用于测试）

修改请求代码，使用 Node.js 原生的 `http` 或 `https` 模块：

```typescript
// app/actions/user-actions.ts
'use server';

import https from 'node:https';

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ name, email });
    
    const options = {
      hostname: 'jsonplaceholder.typicode.com',
      port: 443,
      path: '/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ success: true, data: JSON.parse(body) });
      });
    });
    
    req.on('error', (error) => {
      reject({ success: false, error: error.message });
    });
    
    req.write(data);
    req.end();
  });
}
```

#### 方案 2：使用 API Route 作为代理

在 API Route 中发起请求，这样可以更好地被拦截：

```typescript
// app/api/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // 这里的 fetch 可能仍然使用 Next.js 的实现
  // 但可以尝试使用 http 模块
  const https = await import('node:https');
  
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    
    const options = {
      hostname: 'jsonplaceholder.typicode.com',
      port: 443,
      path: '/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };
    
    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        resolve(NextResponse.json(JSON.parse(responseBody)));
      });
    });
    
    req.write(data);
    req.end();
  });
}
```

然后在 Server Action 中调用这个 API：

```typescript
// app/actions/user-actions.ts
'use server';

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  
  const response = await fetch('http://localhost:3000/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  });
  
  return response.json();
}
```

#### 方案 3：等待 Next.js 支持

这是一个已知的限制。未来的版本可能会：
1. Next.js 提供钩子来拦截 fetch 请求
2. node-network-devtools 提供 Next.js 特定的拦截器

### 当前可以监听的请求

虽然 Next.js 的 `fetch` 可能无法被拦截，但以下请求仍然可以被捕获：

1. **使用 http/https 模块的请求**
   ```typescript
   import https from 'node:https';
   https.get('https://api.example.com/data', (res) => {
     // 这个请求会被捕获
   });
   ```

2. **第三方库的请求**（如果它们使用 http/https 模块）
   ```typescript
   import axios from 'axios';  // axios 使用 http 模块
   await axios.get('https://api.example.com/data');  // 会被捕获
   ```

3. **外部进程的请求**
   如果你的 Next.js 应用调用了其他 Node.js 进程，那些进程中的请求可以被捕获。

### 验证拦截器是否工作

在 `instrumentation.ts` 中添加测试代码：

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { install } = await import('node-network-devtools');
    await install();
    
    // 测试 http 模块
    const https = await import('node:https');
    https.get('https://httpbin.org/get', (res) => {
      console.log('✓ HTTP 模块请求已发送');
    });
    
    // 测试 fetch（可能不会被拦截）
    try {
      await fetch('https://httpbin.org/get');
      console.log('✓ Fetch 请求已发送');
    } catch (err) {
      console.log('⚠ Fetch 请求失败');
    }
  }
}
```

查看 GUI 中是否出现 `httpbin.org` 的请求。如果只看到 http 模块的请求而没有 fetch 的请求，说明 Next.js 的 fetch 确实绕过了拦截器。

### 推荐的开发流程

1. **开发阶段**：使用 http/https 模块来测试 node-network-devtools
2. **生产代码**：继续使用 Next.js 的 fetch（享受缓存等特性）
3. **调试网络问题**：
   - 使用 Next.js 的内置日志
   - 使用浏览器的 Network 面板（客户端请求）
   - 使用 node-network-devtools（服务端 http/https 请求）

### 相关资源

- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Node.js HTTP Module](https://nodejs.org/api/http.html)
- [Node.js HTTPS Module](https://nodejs.org/api/https.html)

### 报告问题

如果你发现了解决 Next.js fetch 拦截的方法，欢迎：
1. 在主项目提交 Issue
2. 提交 Pull Request
3. 分享你的解决方案

## 其他常见问题

### Q: 为什么测试请求能被捕获，但应用请求不能？

A: 测试请求（在 `instrumentation.ts` 中）可能在 Next.js 初始化之前执行，此时使用的是原生的 fetch。而应用请求使用的是 Next.js 修改后的 fetch。

### Q: 可以禁用 Next.js 的 fetch 缓存吗？

A: 可以，但这会失去 Next.js 的性能优势：

```typescript
// next.config.js
module.exports = {
  experimental: {
    fetchCache: 'force-no-store',
  },
};
```

但这不会解决拦截问题，因为 Next.js 仍然使用自己的 fetch 实现。

### Q: 有没有其他工具可以监听 Next.js 的请求？

A: 可以尝试：
1. Next.js 的内置日志（设置 `DEBUG=*` 环境变量）
2. 使用代理服务器（如 mitmproxy）
3. 使用 Next.js 的 middleware 来记录请求

### Q: 未来会支持 Next.js 的 fetch 吗？

A: 这取决于：
1. Next.js 是否提供拦截钩子
2. 是否可以通过 monkey-patching Next.js 的 fetch 实现
3. 社区的需求和贡献

目前建议使用 http/https 模块作为替代方案。
