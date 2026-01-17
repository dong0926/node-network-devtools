# Bug 修复：Next.js Webpack 警告和错误

## 问题描述

在 Next.js 中使用 `node-network-devtools` 时，会出现 Webpack 警告和错误：

### 警告 1：Critical Dependency

```
⚠ Critical dependency: the request of a dependency is an expression

Import trace for requested module:
../../node_modules/.pnpm/import-fresh@3.3.1/node_modules/import-fresh/index.js
../../node_modules/.pnpm/cosmiconfig@9.0.0_typescript@5.9.3/node_modules/cosmiconfig/dist/loaders.js
../../node_modules/.pnpm/puppeteer@23.11.1_typescript@5.9.3/node_modules/puppeteer/lib/esm/puppeteer/getConfiguration.js
../../node_modules/.pnpm/puppeteer@23.11.1_typescript@5.9.3/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js
../../test/node-network-devtools/dist/esm/gui/browser-launcher.js
../../test/node-network-devtools/dist/esm/index.js
```

### 错误 2：Module Not Found

```
Module not found: Can't resolve 'source-map-support' 
in 'C:\Users\Administrator\Documents\codes\test\node-network-devtools\node_modules\.pnpm\typescript@5.9.3\node_modules\typescript\lib'
```

## 根本原因

### 依赖链分析

```
instrumentation.ts (服务端)
  ↓ import
node-network-devtools/index.js
  ↓ export
gui/browser-launcher.js
  ↓ import (动态)
puppeteer (可选依赖)
  ↓ import
cosmiconfig → import-fresh (动态 require) ⚠️
typescript → source-map-support ❌
```

### 问题根源

1. **Webpack 静态分析**：即使使用动态 `import()`，Webpack 在静态分析阶段仍会尝试解析模块
2. **客户端打包**：Next.js 的 Webpack 试图在客户端打包中包含服务端专用的依赖
3. **动态 require**：`import-fresh` 使用动态 `require()`，Webpack 无法静态分析
4. **缺失依赖**：`typescript` 包需要 `source-map-support`，但在客户端环境中不存在

## 解决方案

### 修改文件

#### 1. 源代码修改（主要修复）

**文件**：`src/gui/browser-launcher.ts`

**修改内容**：使用 `eval` 避免 Webpack 静态分析

```typescript
// 原代码（会被 Webpack 分析）
const puppeteer = await import('puppeteer');

// 修复后（Webpack 无法静态分析）
const puppeteerModule = 'puppeteer';
const puppeteer = await (0, eval)(`import('${puppeteerModule}')`);
```

**原理**：
- `eval` 是运行时执行，Webpack 无法在编译时分析其内容
- `(0, eval)` 是间接调用 eval，确保在全局作用域执行
- Webpack 看到 `eval` 会跳过静态分析，不会尝试解析 puppeteer 的依赖树

#### 2. Next.js 配置（备用方案）

**文件**：`examples/nextjs-app/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  
  images: {
    domains: ['jsonplaceholder.typicode.com'],
  },

  // Webpack 配置：排除服务端专用依赖
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 在客户端打包时，排除这些服务端专用的包
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

    // 标记 node-network-devtools 为外部依赖（仅服务端）
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        // 保持 puppeteer 为外部依赖，避免打包
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

### 配置说明

#### 客户端配置 (`!isServer`)

1. **resolve.fallback**
   - 告诉 Webpack 在客户端打包时将这些模块解析为 `false`
   - 这意味着如果代码尝试导入这些模块，会得到一个空对象
   - 由于这些模块只在服务端使用，客户端永远不会执行到这些代码

2. **ignoreWarnings**
   - 忽略来自特定模块的警告
   - 使用正则表达式匹配模块路径
   - 不影响功能，只是隐藏警告信息

#### 服务端配置 (`isServer`)

1. **externals**
   - 将 `puppeteer` 标记为外部依赖
   - Webpack 不会打包这个模块，而是在运行时通过 `require()` 加载
   - 减少服务端打包体积
   - 避免打包可选依赖

## 验证修复

### 1. 应用配置

将上述配置添加到 `next.config.js`。

### 2. 清理缓存

```bash
rm -rf .next
# 或 Windows
rmdir /s /q .next
```

### 3. 重启开发服务器

```bash
pnpm dev
```

### 4. 检查结果

启动后应该看到：
- ✅ 没有 "Critical dependency" 警告
- ✅ 没有 "Module not found" 错误
- ✅ 构建成功
- ✅ `node-network-devtools` 正常工作

## 影响范围

### 修改的文件

1. `examples/nextjs-app/next.config.js` - 添加 Webpack 配置
2. `NEXTJS-WEBPACK-WARNINGS.md` - 新增详细文档
3. `examples/nextjs-app/README.md` - 更新配置说明
4. `examples/nextjs-app/TROUBLESHOOTING.md` - 添加故障排查条目

### 兼容性

- ✅ 向后兼容，不影响现有功能
- ✅ 仅影响 Next.js 项目的 Webpack 配置
- ✅ 不影响其他框架（Express、纯 Node.js 等）
- ✅ 服务端功能完全不受影响

## 为什么这样做有效？

### Webpack 的 resolve.fallback

当 Webpack 遇到无法解析的模块时：

```javascript
config.resolve.fallback = {
  puppeteer: false,  // 将 puppeteer 解析为空对象
}
```

这告诉 Webpack："如果在客户端代码中遇到 `import 'puppeteer'`，不要尝试打包它，直接返回一个空对象。"

由于 `browser-launcher.ts` 使用了动态导入：

```typescript
const puppeteer = await import('puppeteer');
```

而且这段代码只在服务端运行（通过 `instrumentation.ts` 的 `NEXT_RUNTIME` 检查），客户端永远不会执行到这里，所以设置为 `false` 是安全的。

### ignoreWarnings

即使设置了 `fallback`，Webpack 在静态分析阶段仍会扫描 `puppeteer` 的依赖树，发现 `import-fresh` 使用动态 `require()`。

`ignoreWarnings` 告诉 Webpack："我知道这些模块有警告，但我确定它们不会在客户端运行，所以忽略这些警告。"

### externals（服务端）

在服务端打包时，将 `puppeteer` 标记为外部依赖：

```javascript
if (request === 'puppeteer') {
  return callback(null, `commonjs ${request}`);
}
```

这告诉 Webpack："不要打包 puppeteer，在运行时通过 `require('puppeteer')` 加载。"

好处：
1. 减少服务端打包体积
2. 避免打包可选依赖
3. 保持 puppeteer 的原生功能

## 最佳实践

### 1. 服务端专用代码使用动态导入

```typescript
// ✅ 好的做法
if (process.env.NEXT_RUNTIME === 'nodejs') {
  const { install } = await import('node-network-devtools');
  await install();
}

// ❌ 避免这样做
import { install } from 'node-network-devtools';
```

### 2. 在 next.config.js 中明确排除服务端依赖

```javascript
config.resolve.fallback = {
  fs: false,
  net: false,
  // ... 其他服务端模块
};
```

### 3. 使用 instrumentation hook

```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 仅在服务端运行
  }
}
```

## 相关问题

这个问题通常出现在以下场景：
- 在 Next.js 中使用包含可选依赖的 npm 包
- 包使用了动态 `import()` 或 `require()`
- 包依赖了 Node.js 内置模块或服务端专用库

类似的包可能也会遇到这个问题：
- `puppeteer`
- `playwright`
- `sharp`（图片处理）
- `sqlite3`（数据库）
- 任何使用 native 模块的包

## 修复日期

2026-01-17

## 相关文档

- [NEXTJS-WEBPACK-WARNINGS.md](./NEXTJS-WEBPACK-WARNINGS.md) - 详细的问题分析和解决方案
- [examples/nextjs-app/README.md](./examples/nextjs-app/README.md) - Next.js 示例文档
- [examples/nextjs-app/TROUBLESHOOTING.md](./examples/nextjs-app/TROUBLESHOOTING.md) - 故障排查指南
