# Next.js Puppeteer 自动检测和处理

**日期**：2026-01-18  
**版本**：v0.2.0  
**类型**：功能改进

## 概述

实现了 Webpack 环境自动检测机制，解决了 Next.js 项目中 Puppeteer 导入失败的问题。库现在能够自动检测 Webpack 打包环境并优雅降级，无需用户手动配置。

## 问题背景

在 Next.js 项目中使用 `node-network-devtools` 时，会遇到 Puppeteer 导入失败错误：

```
Error: Cannot find package 'puppeteer' imported from 
C:\...\pl2w-website01\.next\server\_instrument_test_node-network-devtools_dist_esm_index_js.js
```

### 根本原因

1. Next.js 使用 Webpack 打包 `instrumentation.ts` 到 `.next/server/` 目录
2. 动态 import 在 Webpack 打包环境中无法正确解析模块路径
3. Node.js 从 `.next/server/` 目录查找 `puppeteer`，而不是从项目根目录

## 解决方案

### 实现的改进

在 `src/gui/browser-launcher.ts` 中添加了 `isWebpackEnvironment()` 方法：

```typescript
private isWebpackEnvironment(): boolean {
  // 检测 webpack 特有的全局变量
  if (typeof (globalThis as any).__webpack_require__ !== 'undefined') {
    return true;
  }
  
  // 检测 Next.js 的 webpack-internal 路径
  if (typeof Error.captureStackTrace === 'function') {
    const stack = new Error().stack || '';
    if (stack.includes('webpack-internal://') || stack.includes('.next/server/')) {
      return true;
    }
  }
  
  // 检测 process.env 中的 Next.js 标识
  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.__NEXT_PROCESSED_ENV) {
    return true;
  }
  
  return false;
}
```

### 自动降级逻辑

在 `openWithPuppeteer()` 方法开始时检测环境：

```typescript
private async openWithPuppeteer(url: string): Promise<void> {
  // 检测 Webpack 环境，自动降级
  if (this.isWebpackEnvironment()) {
    console.warn(`
[node-network-devtools] 检测到 Webpack 打包环境（Next.js/其他）

由于 Webpack 打包限制，无法自动打开浏览器。
GUI 服务器已启动，请手动访问：${url}

提示：你可以在配置中设置 autoOpen: false 来禁用此警告。
    `);
    // 不抛出错误，静默失败
    return;
  }
  
  // ... 继续 Puppeteer 导入和启动逻辑
}
```

## 用户体验改进

### 之前（v0.1.x）

- 应用启动失败，抛出错误
- 用户必须手动配置 `autoOpen: false`
- 错误信息不够友好

### 现在（v0.2.0）

- 自动检测并优雅降级
- 显示友好的警告信息
- 应用正常启动，GUI 正常工作
- 无需任何手动配置

## 检测机制

库通过以下三种方式检测 Webpack 环境：

1. **全局变量检测**：`__webpack_require__`
2. **堆栈跟踪检测**：`webpack-internal://` 或 `.next/server/` 路径
3. **环境变量检测**：`NEXT_RUNTIME` 或 `__NEXT_PROCESSED_ENV`

## 代码变更

### 修改的文件

- `src/gui/browser-launcher.ts`：添加环境检测和自动降级逻辑
- `NEXTJS-PUPPETEER-ISSUE.md`：更新文档说明自动处理机制

### 移除的代码

- 移除了未使用的 `checkPuppeteerInstalled()` 方法

## 测试验证

### 手动测试场景

1. ✅ 在 Next.js 项目中启动应用
2. ✅ 验证自动检测是否工作
3. ✅ 验证警告信息是否友好
4. ✅ 验证 GUI 服务器是否正常启动
5. ✅ 验证手动访问 GUI 是否正常

### 预期行为

- 检测到 Webpack 环境时显示警告
- 不抛出错误，不中断应用启动
- GUI 服务器正常启动
- 用户可以手动访问 GUI URL

## 文档更新

### 更新的文档

1. `NEXTJS-PUPPETEER-ISSUE.md`：
   - 添加"已自动处理"说明
   - 更新问题背景和解决方案
   - 说明自动检测机制
   - 提供可选的手动配置方案

2. `docs/guides/faq.md`：
   - 已包含 Next.js Puppeteer 问题说明

3. `examples/nextjs-app/README.md`：
   - 已包含警告和解决方案

## 向后兼容性

- ✅ 完全向后兼容
- ✅ 现有的手动配置仍然有效
- ✅ 不影响非 Webpack 环境的行为

## 后续工作

### 可选改进

1. 在 `register.ts` 中也添加类似的环境检测
2. 提供配置选项来自定义警告信息
3. 添加更多的 Webpack 环境检测方法

### 文档整理

- ✅ 将 `NEXTJS-PUPPETEER-ISSUE.md` 移动到 `docs/maintenance/`
- ✅ 按照文档管理规范重命名

## 相关链接

- [FAQ - Next.js 中 Puppeteer 导入失败](../guides/faq.md#q-nextjs-中-puppeteer-导入失败怎么办)
- [Next.js 示例](../../examples/nextjs-app/README.md)
- [故障排查指南](../troubleshooting/common-issues.md)
- [移除 Inspector 集成记录](./remove-inspector-puppeteer-only-2026-01-18.md)

## 总结

通过添加自动环境检测机制，我们显著改善了 Next.js 用户的体验。用户不再需要手动配置或处理错误，库会自动检测并优雅降级。这是一个重要的用户体验改进，使得库在 Next.js 环境中更加易用。
