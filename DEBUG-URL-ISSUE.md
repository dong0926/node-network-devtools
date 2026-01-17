# 调试 URL 重复拼接问题

## 问题描述

你遇到的错误：

```
TypeError: Invalid URL
input: 'http://127.0.0.1:7897http://api.pl2w.top/fulu-page-cloud/anon/cms/getVersion'
```

## 调试版本已启用

我已经在 `src/interceptors/undici-patcher.ts` 中添加了详细的调试日志。

### 如何使用调试版本

#### 步骤 1：重新构建（如果使用本地开发）

```bash
cd /path/to/node-network-devtools
pnpm build
```

#### 步骤 2：在你的 Next.js 项目中更新

```bash
cd /path/to/your-nextjs-project

# 清理缓存
rm -rf .next node_modules

# 重新安装
pnpm install

# 如果使用本地链接
pnpm link /path/to/node-network-devtools
```

#### 步骤 3：启动并查看日志

```bash
pnpm dev
```

### 预期的调试输出

当请求发生时，你会在控制台看到类似这样的详细日志：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[undici-patcher] 🔍 URL 构建调试信息:
  原始 opts.origin: http://127.0.0.1:7897
  原始 opts.path: http://api.pl2w.top/fulu-page-cloud/anon/cms/getVersion
  处理后 origin: http://127.0.0.1:7897
  处理后 path: http://api.pl2w.top/fulu-page-cloud/anon/cms/getVersion
  path 类型: string
  path.startsWith 可用? true
  path.startsWith("http://"): true
  path.startsWith("https://"): false
  最终 URL: http://api.pl2w.top/fulu-page-cloud/anon/cms/getVersion
  URL 是否有效: true
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[undici-patcher] 拦截到请求: GET http://api.pl2w.top/fulu-page-cloud/anon/cms/getVersion
```

### 需要收集的信息

请将完整的调试日志复制并提供给我，特别是：

1. **原始 opts.origin** - 显示原始的 origin 值
2. **原始 opts.path** - 显示原始的 path 值
3. **path 类型** - 确认 path 是否是字符串
4. **path.startsWith 可用?** - 确认 startsWith 方法是否可用
5. **path.startsWith("http://")** - 检查是否检测到完整 URL
6. **最终 URL** - 显示最终构建的 URL

### 可能的问题场景

#### 场景 1：path 不是字符串

如果看到：

```
path 类型: object
path.startsWith 可用? false
⚠️ 警告: path 不是字符串或没有 startsWith 方法!
```

这说明 `path` 不是字符串类型，需要额外的类型转换。

#### 场景 2：startsWith 检查失败

如果看到：

```
path.startsWith("http://"): false
path.startsWith("https://"): false
最终 URL: http://127.0.0.1:7897http://api.pl2w.top/...
```

这说明 `startsWith` 检查没有正确工作，可能是：
- path 包含前导空格
- path 是 Buffer 或其他类型
- path 使用了不同的编码

#### 场景 3：修复未生效

如果根本看不到调试日志，说明：
- 使用的是旧版本的代码
- 缓存没有清理干净
- 使用了错误的包

### 临时解决方案

在收集调试信息的同时，你可以尝试以下临时解决方案：

#### 方案 1：禁用代理

```bash
# 临时禁用 HTTP 代理
unset HTTP_PROXY
unset HTTPS_PROXY

# Windows
set HTTP_PROXY=
set HTTPS_PROXY=

# 然后启动
pnpm dev
```

#### 方案 2：禁用 undici 拦截

在 `instrumentation.ts` 中：

```typescript
const { install, setConfig } = await import('@mt0926/node-network-devtools');

setConfig({
  interceptUndici: false,  // 临时禁用 undici 拦截
  interceptHttp: true,     // 只使用 HTTP 拦截
});

await install();
```

#### 方案 3：使用环境变量

```bash
# 禁用 undici 拦截
NND_INTERCEPT_UNDICI=false pnpm dev
```

### 如何提供反馈

请提供以下信息：

1. **完整的调试日志**（从 ━━━ 开始到 ━━━ 结束的部分）
2. **你的环境信息**：
   - Node.js 版本：`node -v`
   - Next.js 版本：查看 `package.json`
   - 是否使用代理：`echo $HTTP_PROXY`
   - 操作系统：Windows/Linux/macOS

3. **你的代码片段**（如果可能）：
   - 发起请求的代码
   - `instrumentation.ts` 的内容

### 示例反馈格式

```
## 环境信息
- Node.js: v20.10.0
- Next.js: 14.0.0
- 代理: http://127.0.0.1:7897
- 操作系统: Windows 11

## 调试日志
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[undici-patcher] 🔍 URL 构建调试信息:
  原始 opts.origin: [你的日志]
  原始 opts.path: [你的日志]
  ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 错误信息
[完整的错误堆栈]
```

### 验证修复是否生效

运行检查脚本：

```bash
node scripts/check-version.cjs
```

应该看到：

```
✅ URL 重复拼接修复
   ✅ 已修复
```

如果看到 `❌ 未修复`，说明构建没有生效，需要重新构建。

### 清理缓存的完整步骤

```bash
# 1. 在 node-network-devtools 项目
cd /path/to/node-network-devtools
pnpm build

# 2. 在你的 Next.js 项目
cd /path/to/your-nextjs-project

# 3. 完全清理
rm -rf .next
rm -rf node_modules
rm -rf node_modules/.pnpm
rm pnpm-lock.yaml  # 可选，如果问题严重

# 4. 重新安装
pnpm install

# 5. 如果使用本地链接
pnpm link /path/to/node-network-devtools

# 6. 验证版本
node node_modules/@mt0926/node-network-devtools/scripts/check-version.cjs

# 7. 启动
pnpm dev
```

### Windows 用户

```cmd
:: 1. 在 node-network-devtools 项目
cd \path\to\node-network-devtools
pnpm build

:: 2. 在你的 Next.js 项目
cd \path\to\your-nextjs-project

:: 3. 完全清理
rmdir /s /q .next
rmdir /s /q node_modules
del pnpm-lock.yaml

:: 4. 重新安装
pnpm install

:: 5. 启动
pnpm dev
```

## 下一步

1. ✅ 重新构建 node-network-devtools
2. ✅ 清理 Next.js 项目缓存
3. ✅ 重新安装依赖
4. ✅ 启动开发服务器
5. 📋 复制完整的调试日志
6. 📤 提供反馈

有了详细的调试日志，我们就能准确定位问题所在并提供针对性的修复！
