# Next.js Webpack 警告和错误修复

## 问题描述

在 Next.js 中使用 `node-network-devtools` 时，可能会遇到以下 Webpack 警告和错误：

### 1. Critical Dependency 警告

```
⚠ Critical dependency: the request of a dependency is an expression
Import trace:
  - import-fresh/index.js
  - cosmiconfig/dist/loaders.js
  - puppeteer/lib/esm/puppeteer/getConfiguration.js
  - node-network-devtools/dist/esm/gui/browser-launcher.js
```

### 2. Module Not Found 错误

```
Module not found: Can't resolve 'source-map-support' 
in 'node_modules/typescript/lib'
```

## 根本原因

这些问题源于 **Next.js 的 Webpack 在客户端打包时，试图打包服务端专用的依赖**：

1. **puppeteer**：是 `node-network-devtools` 的可选依赖，仅用于服务端浏览器启动
2. **cosmiconfig/import-fresh**：被 puppeteer 用于配置加载，使用了动态 `require()`
3. **typescript**：被 puppeteer 的配置系统引入
4. **source-map-support**：TypeScript 运行时依赖

这些包都是 **服务端专用**，不应该被打包到客户端代码中。

## 解决方案

### 方案 1：修改源代码（推荐，已实施）

在 `src/gui/browser-launcher.ts` 中使用 `eval` 来完全避免 Webpack 的静态分析：

```typescript
// 使用 eval 来完全避免静态分析
// 这样 Webpack 就不会尝试解析 puppeteer 的依赖树
const puppeteerModule = 'puppeteer';
const puppeteer = await (0, eval)(`import('${puppeteerModule}')`);
```

这个方法的优点：
- ✅ 完全避免 Webpack 静态分析
- ✅ 不需要修改 Next.js 配置
- ✅ 对所有使用者都有效
- ✅ 不影响运行时功能

**注意**：项目已经应用了这个修复，如果你使用的是最新版本，应该不会再看到这些警告。

### 方案 2：配置 Next.js Webpack（备用方案）

如果方案 1 不够，可以在 `next.config.js` 中添加更强的配置：

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
        // 排除 Node.js 内置模块
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        
        // 排除服务端专用依赖
        puppeteer: false,
        'source-map-support': false,
      };

      // 忽略可选依赖的警告
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        {
          module: /node_modules\/puppeteer/,
        },
        {
          module: /node_modules\/import-fresh/,
        },
        {
          module: /node_modules\/cosmiconfig/,
        },
      ];
    }

    // 服务端打包：保持 puppeteer 为外部依赖
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        ({ request }, callback) => {
          if (request === 'puppeteer' || request?.startsWith('puppeteer/')) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
    }

    return config;
  },
};

module.exports = nextConfig;
```

## 配置说明

### 客户端配置 (`!isServer`)

1. **resolve.fallback**：告诉 Webpack 在客户端打包时忽略这些模块
   - Node.js 内置模块（`fs`, `net`, `tls`, `child_process`）
   - 服务端专用依赖（`puppeteer`, `source-map-support`）

2. **ignoreWarnings**：忽略来自这些包的警告
   - `puppeteer`：可选依赖，仅服务端使用
   - `import-fresh`：动态 require 警告
   - `cosmiconfig`：配置加载器警告

### 服务端配置 (`isServer`)

1. **externals**：将 `puppeteer` 标记为外部依赖
   - 避免 Webpack 打包 puppeteer
   - 使用 CommonJS 方式加载
   - 减少服务端打包体积

## 验证修复

应用配置后，重新启动 Next.js 开发服务器：

```bash
pnpm dev
```

你应该看到：
- ✅ 警告消失
- ✅ 构建成功
- ✅ `node-network-devtools` 正常工作

## 为什么会发生这个问题？

### Next.js 的打包机制

Next.js 使用 Webpack 同时打包：
1. **客户端代码**：运行在浏览器中
2. **服务端代码**：运行在 Node.js 中

### 问题触发路径

```
instrumentation.ts (服务端)
  ↓ import
node-network-devtools/index.js
  ↓ export
gui/browser-launcher.js
  ↓ import (动态)
puppeteer (可选依赖)
  ↓ import
cosmiconfig → import-fresh (动态 require)
typescript → source-map-support
```

即使 `instrumentation.ts` 只在服务端运行，Next.js 的 Webpack 仍会尝试分析所有导入路径，包括动态导入。

### 为什么 puppeteer 会被分析？

`browser-launcher.ts` 中使用了动态导入：

```typescript
// 动态导入 puppeteer（可选依赖）
const puppeteer = await import('puppeteer');
```

虽然这是运行时动态导入，但 Webpack 在**静态分析阶段**仍会尝试解析这个模块，导致：
1. 分析 puppeteer 的依赖树
2. 发现 cosmiconfig 使用动态 require → 警告
3. 发现 typescript 需要 source-map-support → 错误

## 最佳实践

### 1. 使用动态导入

对于服务端专用的依赖，始终使用动态导入：

```typescript
// ✅ 好的做法
if (process.env.NEXT_RUNTIME === 'nodejs') {
  const { install } = await import('node-network-devtools');
  await install();
}

// ❌ 避免这样做
import { install } from 'node-network-devtools'; // 会被客户端打包
```

### 2. 配置 Webpack fallback

在 `next.config.js` 中明确排除服务端依赖：

```javascript
config.resolve.fallback = {
  fs: false,
  net: false,
  puppeteer: false,
  // ... 其他服务端模块
};
```

### 3. 使用 instrumentation hook

Next.js 14+ 的 `instrumentation.ts` 是初始化服务端工具的最佳位置：

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 仅在服务端运行
    const { install } = await import('node-network-devtools');
    await install();
  }
}
```

## 相关资源

- [Next.js Webpack 配置](https://nextjs.org/docs/app/api-reference/next-config-js/webpack)
- [Next.js Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
- [Webpack resolve.fallback](https://webpack.js.org/configuration/resolve/#resolvefallback)

## 常见问题

### Q: 为什么不直接移除 puppeteer？

A: `puppeteer` 是可选依赖，提供了更好的浏览器控制。如果不需要，可以不安装：

```bash
# 安装时跳过可选依赖
pnpm install --no-optional
```

### Q: 这会影响功能吗？

A: 不会。这些配置只是告诉 Webpack 不要在客户端打包这些模块。服务端功能完全不受影响。

### Q: 我还是看到警告怎么办？

A: 确保：
1. 配置已正确应用到 `next.config.js`
2. 重启了 Next.js 开发服务器
3. 清理了 `.next` 缓存：`rm -rf .next`

## 修复日期

2026-01-17
