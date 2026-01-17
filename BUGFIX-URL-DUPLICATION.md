# Bug 修复：URL 重复拼接问题

## 问题描述

在 Next.js 应用中使用代理时，会出现 URL 重复拼接的错误：

```
TypeError: Invalid URL
input: 'http://127.0.0.1:7897http://api.pl2w.top/fulu-page-cloud/anon/cms/getVersion'
```

## 根本原因

在 `src/interceptors/undici-patcher.ts` 中，URL 构建逻辑没有考虑代理场景：

```typescript
// 原有代码（有问题）
const origin = opts.origin?.toString() || '';
const path = opts.path || '/';
const url = `${origin}${path}`;  // 直接拼接
```

当使用 HTTP 代理时：
- `origin` = `'http://127.0.0.1:7897'` (代理地址)
- `path` = `'http://api.pl2w.top/fulu-page-cloud/anon/cms/getVersion'` (完整目标 URL)

直接拼接导致：`'http://127.0.0.1:7897http://api.pl2w.top/...'`

## 解决方案

修改 URL 构建逻辑，检测 `path` 是否已经是完整 URL：

```typescript
// 修复后的代码
const origin = opts.origin?.toString() || '';
const path = opts.path || '/';

// 如果 path 已经是完整 URL（以 http:// 或 https:// 开头），直接使用
// 否则拼接 origin 和 path
const url = (path.startsWith('http://') || path.startsWith('https://')) 
  ? path 
  : `${origin}${path}`;
```

## 测试覆盖

添加了三个测试用例来验证修复：

1. **相对路径场景**（正常请求）
   - origin: `'http://example.com'`
   - path: `'/api/users'`
   - 结果: `'http://example.com/api/users'` ✓

2. **HTTP 代理场景**
   - origin: `'http://127.0.0.1:7897'`
   - path: `'http://api.pl2w.top/fulu-page-cloud/anon/cms/getVersion'`
   - 结果: `'http://api.pl2w.top/fulu-page-cloud/anon/cms/getVersion'` ✓

3. **HTTPS 代理场景**
   - origin: `'http://proxy.local:8080'`
   - path: `'https://api.example.com/data'`
   - 结果: `'https://api.example.com/data'` ✓

## 影响范围

- **影响模块**: `src/interceptors/undici-patcher.ts`
- **影响场景**: 使用 HTTP/HTTPS 代理的 fetch 请求
- **兼容性**: 向后兼容，不影响现有功能

## 验证方法

运行测试：

```bash
pnpm test src/interceptors/undici-patcher.test.ts
```

所有测试应该通过（10/10）。

## 相关问题

这个问题通常出现在以下场景：
- 使用 HTTP 代理（如 Charles、Fiddler）
- 企业网络环境中的代理配置
- Next.js 应用中配置了 `HTTP_PROXY` 或 `HTTPS_PROXY` 环境变量

## 修复日期

2026-01-17
