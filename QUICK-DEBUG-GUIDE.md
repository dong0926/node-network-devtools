# 快速调试指南

## 🚨 遇到 URL 重复拼接错误？

```
TypeError: Invalid URL
input: 'http://127.0.0.1:7897http://api.pl2w.top/...'
```

## ⚡ 快速步骤

### 1️⃣ 重新构建（如果使用本地开发）

```bash
cd /path/to/node-network-devtools
pnpm build
```

### 2️⃣ 清理 Next.js 项目

```bash
cd /path/to/your-nextjs-project
rm -rf .next node_modules
pnpm install
```

### 3️⃣ 启动并查看日志

```bash
pnpm dev
```

### 4️⃣ 查找调试信息

在控制台中查找这样的日志：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[undici-patcher] 🔍 URL 构建调试信息:
  原始 opts.origin: ...
  原始 opts.path: ...
  ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5️⃣ 提供反馈

复制完整的调试日志，包括：
- 原始 opts.origin
- 原始 opts.path
- path 类型
- path.startsWith 检查结果
- 最终 URL

## 🔧 临时解决方案

### 方案 A：禁用代理

```bash
unset HTTP_PROXY
unset HTTPS_PROXY
pnpm dev
```

### 方案 B：禁用 undici 拦截

在 `instrumentation.ts` 中：

```typescript
setConfig({
  interceptUndici: false,
  interceptHttp: true,
});
```

### 方案 C：使用环境变量

```bash
NND_INTERCEPT_UNDICI=false pnpm dev
```

## 📚 详细文档

- **DEBUG-URL-ISSUE.md** - 完整的调试指南
- **TROUBLESHOOT-URL-DUPLICATION.md** - 故障排查步骤
- **BUGFIX-URL-DUPLICATION.md** - 修复记录

## ✅ 验证修复

```bash
node scripts/check-version.cjs
```

应该看到：`✅ URL 重复拼接修复 - 已修复`

## 💬 需要帮助？

提供以下信息：
1. 完整的调试日志
2. Node.js 版本：`node -v`
3. Next.js 版本
4. 是否使用代理：`echo $HTTP_PROXY`
5. 操作系统

---

**记住**：清理缓存是关键！`rm -rf .next node_modules`
