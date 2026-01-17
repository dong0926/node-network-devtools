# 验证 Webpack 修复

## 问题

Next.js Webpack 警告和错误：
- ⚠️ Critical dependency: import-fresh
- ❌ Module not found: source-map-support

## 修复方法

### 方法 1：使用 eval 避免静态分析（已实施）

在 `src/gui/browser-launcher.ts` 中：

```typescript
// 使用 eval 来完全避免静态分析
const puppeteerModule = 'puppeteer';
const puppeteer = await (0, eval)(`import('${puppeteerModule}')`);
```

### 方法 2：配置 Next.js（如果方法 1 不够）

在你的 Next.js 项目的 `next.config.js` 中添加：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 客户端：排除服务端模块
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        puppeteer: false,
        'source-map-support': false,
        typescript: false,
      };

      // 忽略警告
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { module: /node_modules\/puppeteer/ },
        { module: /node_modules\/import-fresh/ },
        { module: /node_modules\/cosmiconfig/ },
        { module: /node_modules\/typescript/ },
      ];
    }

    return config;
  },
};

module.exports = nextConfig;
```

## 验证步骤

### 1. 确保使用最新版本

```bash
# 在 node-network-devtools 项目根目录
pnpm build
```

### 2. 在你的 Next.js 项目中

```bash
# 清理缓存
rm -rf .next
# Windows: rmdir /s /q .next

# 重新安装（如果需要）
pnpm install

# 启动开发服务器
pnpm dev
```

### 3. 检查输出

启动后应该看到：
- ✅ 没有 "Critical dependency" 警告
- ✅ 没有 "Module not found" 错误
- ✅ 编译成功

## 如果问题依然存在

### 检查清单

1. **确认版本**
   ```bash
   # 检查 node-network-devtools 版本
   pnpm list @mt0926/node-network-devtools
   ```

2. **清理所有缓存**
   ```bash
   # Next.js 缓存
   rm -rf .next
   
   # node_modules
   rm -rf node_modules
   pnpm install
   ```

3. **检查 instrumentation.ts**
   
   确保使用动态导入：
   ```typescript
   export async function register() {
     if (process.env.NEXT_RUNTIME === 'nodejs') {
       // ✅ 动态导入
       const { install } = await import('@mt0926/node-network-devtools');
       await install();
     }
   }
   ```

4. **应用 Next.js 配置**
   
   如果方法 1 不够，应用方法 2 的配置。

### 终极方案：禁用 puppeteer

如果你不需要 puppeteer 功能，可以跳过安装可选依赖：

```bash
# 安装时跳过可选依赖
pnpm install --no-optional @mt0926/node-network-devtools
```

或者在 `instrumentation.ts` 中禁用：

```typescript
const { install, setConfig } = await import('@mt0926/node-network-devtools');

setConfig({
  usePuppeteer: false,  // 禁用 puppeteer
  autoOpen: true,       // 使用系统默认浏览器
});

await install();
```

## 技术细节

### 为什么 eval 有效？

```typescript
// ❌ Webpack 会静态分析
await import('puppeteer')

// ✅ Webpack 无法分析 eval 的内容
await (0, eval)(`import('puppeteer')`)
```

Webpack 的静态分析器：
1. 扫描所有 `import()` 语句
2. 尝试解析模块路径
3. 分析依赖树
4. 发现问题模块 → 警告/错误

使用 `eval` 后：
1. Webpack 看到 `eval`
2. 跳过静态分析（无法分析运行时代码）
3. 不会尝试解析 puppeteer
4. 没有警告/错误

### 为什么是 `(0, eval)` 而不是 `eval`？

```typescript
// 直接调用（局部作用域）
eval(`import('puppeteer')`)

// 间接调用（全局作用域）
(0, eval)(`import('puppeteer')`)
```

`(0, eval)` 是一个技巧：
- 确保 eval 在全局作用域执行
- 避免局部变量污染
- 更安全的 eval 使用方式

## 相关资源

- [NEXTJS-WEBPACK-WARNINGS.md](./NEXTJS-WEBPACK-WARNINGS.md) - 详细问题分析
- [BUGFIX-NEXTJS-WEBPACK.md](./BUGFIX-NEXTJS-WEBPACK.md) - 修复记录
- [Webpack Dynamic Imports](https://webpack.js.org/guides/code-splitting/#dynamic-imports)
- [Next.js Webpack Config](https://nextjs.org/docs/app/api-reference/next-config-js/webpack)

## 常见问题

### Q: eval 不是不安全吗？

A: 在这个场景中是安全的，因为：
1. 字符串是硬编码的 `'puppeteer'`，不是用户输入
2. 只在服务端运行（`instrumentation.ts` 的 `NEXT_RUNTIME` 检查）
3. 仅用于避免 Webpack 静态分析，不涉及动态代码执行

### Q: 会影响性能吗？

A: 不会。`eval` 只在初始化时执行一次，不在热路径上。

### Q: 为什么不直接移除 puppeteer？

A: puppeteer 是可选功能，提供更好的浏览器控制。如果不需要，可以：
- 不安装：`pnpm install --no-optional`
- 或禁用：`setConfig({ usePuppeteer: false })`

### Q: 我的项目还是有警告

A: 请按照"检查清单"逐步排查：
1. 确认使用最新版本
2. 清理所有缓存
3. 应用 Next.js 配置（方法 2）
4. 如果仍有问题，提供完整的错误日志

## 修复日期

2026-01-17
