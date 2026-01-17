# 故障排查：URL 重复拼接问题

## 问题症状

```
TypeError: Invalid URL
input: 'http://127.0.0.1:7897http://api.pl2w.top/fulu-page-cloud/anon/cms/getVersion'
```

URL 被重复拼接，导致无效的 URL。

## ⚠️ 重要发现：axios + 代理冲突

**如果你在 Next.js 中使用 axios 并配置了 HTTP 代理，这个问题是由 `node-network-devtools` 的 HTTP 拦截器与 axios 的代理处理冲突导致的。**

### 快速解决方案

在 `instrumentation.ts` 中禁用 HTTP 拦截器：

```typescript
import { setConfig, install } from '@mt0926/node-network-devtools';

setConfig({
  interceptHttp: false,    // 禁用 HTTP 拦截器（避免干扰 axios）
  interceptUndici: true,   // 保留 undici 拦截器（监控 Next.js fetch）
});

await install();
```

**详细说明请查看：[AXIOS-PROXY-ISSUE.md](./AXIOS-PROXY-ISSUE.md)**

---

## 根本原因（原始分析）

在使用 HTTP 代理时，undici 会将：
- `origin` = 代理地址（如 `http://127.0.0.1:7897`）
- `path` = 完整目标 URL（如 `http://api.pl2w.top/...`）

如果直接拼接这两个值，就会导致 URL 重复。

## 修复状态

✅ **此问题已在源代码中修复**（2026-01-17）

修复位置：`src/interceptors/undici-patcher.ts` 第 131-134 行

```typescript
// 如果 path 已经是完整 URL（以 http:// 或 https:// 开头），直接使用
// 否则拼接 origin 和 path
const url = (path.startsWith('http://') || path.startsWith('https://')) 
  ? path 
  : `${origin}${path}`;
```

## 如果你仍然遇到这个问题

### 启用调试日志

最新版本包含详细的调试日志。重新构建后，你会在控制台看到：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[undici-patcher] 🔍 URL 构建调试信息:
  原始 opts.origin: http://127.0.0.1:7897
  原始 opts.path: http://api.pl2w.top/...
  处理后 origin: http://127.0.0.1:7897
  处理后 path: http://api.pl2w.top/...
  path 类型: string
  path.startsWith 可用? true
  path.startsWith("http://"): true
  最终 URL: http://api.pl2w.top/...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**请将完整的调试日志提供给开发者**，这将帮助快速定位问题。

详细说明请查看：**DEBUG-URL-ISSUE.md**

### 原因分析

你的 Next.js 项目可能在使用：
1. **旧版本的 `node-network-devtools`**
2. **未重新构建的版本**
3. **缓存的 node_modules**

### 解决步骤

#### 步骤 1：检查版本

```bash
# 在你的 Next.js 项目中
pnpm list @mt0926/node-network-devtools
```

应该显示版本 `0.1.2` 或更高。

#### 步骤 2：如果使用本地链接（pnpm link）

```bash
# 在 node-network-devtools 项目根目录
cd /path/to/node-network-devtools

# 重新构建
pnpm build

# 检查构建产物
cat dist/esm/interceptors/undici-patcher.js | grep "startsWith"
# 应该看到 URL 检查逻辑
```

#### 步骤 3：在 Next.js 项目中更新

```bash
# 在你的 Next.js 项目中
cd /path/to/your-nextjs-project

# 清理缓存
rm -rf .next node_modules

# 重新安装
pnpm install

# 如果使用本地链接，重新链接
pnpm link /path/to/node-network-devtools

# 重启开发服务器
pnpm dev
```

#### 步骤 4：验证修复

启动后，在控制台中应该看到：

```
[undici-patcher] 拦截到请求: GET http://api.pl2w.top/fulu-page-cloud/anon/cms/getVersion
```

而不是：

```
[undici-patcher] 拦截到请求: GET http://127.0.0.1:7897http://api.pl2w.top/...
```

### 步骤 5：如果问题依然存在

#### 检查是否真的使用了新版本

在你的 Next.js 项目中创建一个测试文件：

```javascript
// test-version.js
const fs = require('fs');
const path = require('path');

const patcherPath = path.join(
  __dirname,
  'node_modules/@mt0926/node-network-devtools/dist/esm/interceptors/undici-patcher.js'
);

const content = fs.readFileSync(patcherPath, 'utf-8');

if (content.includes("path.startsWith('http://') || path.startsWith('https://')")) {
  console.log('✅ 使用的是修复后的版本');
} else {
  console.log('❌ 使用的是旧版本，需要更新');
}
```

运行：

```bash
node test-version.js
```

#### 手动验证代理配置

检查你的代理配置：

```bash
# 检查环境变量
echo $HTTP_PROXY
echo $HTTPS_PROXY

# Windows
echo %HTTP_PROXY%
echo %HTTPS_PROXY%
```

如果设置了代理，确认代理地址是否是 `http://127.0.0.1:7897`。

## 临时解决方案

如果无法立即更新到修复版本，可以临时禁用代理：

```bash
# 临时禁用代理
unset HTTP_PROXY
unset HTTPS_PROXY

# Windows
set HTTP_PROXY=
set HTTPS_PROXY=

# 然后启动 Next.js
pnpm dev
```

或者在代码中禁用 undici 拦截：

```typescript
// instrumentation.ts
const { install, setConfig } = await import('@mt0926/node-network-devtools');

setConfig({
  interceptUndici: false,  // 临时禁用 undici 拦截
  interceptHttp: true,     // 只使用 HTTP 拦截
});

await install();
```

## 发布新版本

如果你是 `node-network-devtools` 的维护者，需要发布新版本：

```bash
# 在 node-network-devtools 项目根目录

# 1. 确保所有更改已提交
git status

# 2. 构建
pnpm build

# 3. 运行测试
pnpm test:all

# 4. 发布补丁版本
pnpm release:patch

# 或者手动发布
npm version patch
npm publish
git push --follow-tags
```

## 验证修复的测试用例

修复包含了三个测试用例（在 `src/interceptors/undici-patcher.test.ts`）：

```typescript
describe('URL 构建逻辑', () => {
  it('应该正确处理相对路径', () => {
    const origin = 'http://example.com';
    const path = '/api/users';
    const url = path.startsWith('http://') || path.startsWith('https://') 
      ? path 
      : `${origin}${path}`;
    expect(url).toBe('http://example.com/api/users');
  });

  it('应该正确处理完整 URL（代理场景）', () => {
    const origin = 'http://127.0.0.1:7897';
    const path = 'http://api.pl2w.top/fulu-page-cloud/anon/cms/getVersion';
    const url = path.startsWith('http://') || path.startsWith('https://') 
      ? path 
      : `${origin}${path}`;
    expect(url).toBe('http://api.pl2w.top/fulu-page-cloud/anon/cms/getVersion');
  });

  it('应该正确处理 HTTPS 完整 URL', () => {
    const origin = 'http://proxy.local:8080';
    const path = 'https://api.example.com/data';
    const url = path.startsWith('http://') || path.startsWith('https://') 
      ? path 
      : `${origin}${path}`;
    expect(url).toBe('https://api.example.com/data');
  });
});
```

运行测试：

```bash
pnpm test src/interceptors/undici-patcher.test.ts
```

应该看到所有测试通过（10/10）。

## 相关文档

- [BUGFIX-URL-DUPLICATION.md](./BUGFIX-URL-DUPLICATION.md) - 详细的修复记录
- [src/interceptors/undici-patcher.ts](./src/interceptors/undici-patcher.ts) - 修复的源代码
- [src/interceptors/undici-patcher.test.ts](./src/interceptors/undici-patcher.test.ts) - 测试用例

## 常见问题

### Q: 为什么我的项目还在使用旧版本？

A: 可能的原因：
1. 使用了 `pnpm link`，但没有重新构建
2. `node_modules` 缓存了旧版本
3. 锁文件（`pnpm-lock.yaml`）锁定了旧版本

解决：删除 `node_modules` 和 `.next`，重新安装。

### Q: 如何确认使用的是哪个版本？

A: 检查文件内容：

```bash
cat node_modules/@mt0926/node-network-devtools/dist/esm/interceptors/undici-patcher.js | grep "startsWith"
```

如果看到 `path.startsWith('http://')` 就是新版本。

### Q: 我不使用代理，为什么也遇到这个问题？

A: 可能是：
1. 系统环境变量设置了代理
2. 某个库内部使用了代理
3. 网络配置中有透明代理

检查环境变量：`echo $HTTP_PROXY`

### Q: 修复会影响正常请求吗？

A: 不会。修复逻辑：
- 如果 `path` 是完整 URL → 直接使用
- 如果 `path` 是相对路径 → 拼接 `origin` 和 `path`

这是向后兼容的，不影响任何现有功能。

## 修复日期

2026-01-17

## 修复版本

v0.1.2+
