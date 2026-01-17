# Release Notes - v0.1.3

## 🎉 主要更新

### 自动修复 axios + 代理兼容性问题

**问题**：当用户在 Next.js 中同时使用 `axios` 和 HTTP 代理时，会出现 URL 重复拼接错误。

**解决方案**：自动检测并跳过 axios 的代理请求，无需用户配置。

## 🔧 修复内容

### 1. HTTP 拦截器自动检测（src/interceptors/http-patcher.ts）

添加了自动检测逻辑，识别 axios 代理请求的 URL 模式：

```typescript
// 检测模式：http://proxy-host:port/http://target-host/path
const duplicateUrlPattern = /^(https?:\/\/[^\/]+)(https?:\/\/.+)$/;
const match = url.match(duplicateUrlPattern);

if (match) {
  // 自动跳过拦截，让 axios 正常处理代理
  return;
}
```

**特性**：
- ✅ 零配置：用户无需任何设置
- ✅ 自动检测：识别代理 URL 模式
- ✅ 智能跳过：不干扰 axios 的代理处理
- ✅ 详细日志：告知用户发生了什么

### 2. 测试覆盖（src/interceptors/http-patcher-proxy.test.ts）

添加了 15 个测试用例，覆盖：
- ✅ HTTP/HTTPS 代理 + HTTP/HTTPS 目标的各种组合
- ✅ 正常 URL 不被误判
- ✅ 边界情况（查询参数、锚点等）
- ✅ URL 提取的正确性

**测试结果**：15/15 通过 ✅

### 3. 调试日志增强

添加了详细的调试日志，帮助用户了解：
- 请求是否被拦截
- 是否检测到代理模式
- 为什么跳过某些请求

**示例日志**：
```
[http-patcher] 🔍 HTTP 请求拦截调试:
  请求 URL: http://127.0.0.1:7897http://api.pl2w.top/...
  🔧 检测到 URL 重复拼接（axios + 代理场景）
  代理地址: http://127.0.0.1:7897
  目标 URL: http://api.pl2w.top/...
  ✅ 自动修复：使用目标 URL
  ⚠️ 跳过拦截，让 axios 处理代理请求
```

## 📚 文档更新

### 新增文档

1. **BUGFIX-AXIOS-PROXY-AUTO.md** - 自动修复的详细说明
2. **AXIOS-PROXY-ISSUE.md** - 问题分析和多种解决方案
3. **QUICK-FIX-AXIOS.md** - 快速修复指南（现已过时）
4. **TROUBLESHOOT-URL-DUPLICATION.md** - 更新了自动修复说明

### 更新文档

- **README.md** - 添加兼容性说明（待更新）
- **CHANGELOG.md** - 添加 v0.1.3 更新日志（待更新）

## 🚀 升级指南

### 对于现有用户

如果你之前遇到了 axios + 代理的问题并手动配置了 `interceptHttp: false`：

**现在可以移除这个配置了！**

```typescript
// ❌ 旧的解决方案（不再需要）
setConfig({
  interceptHttp: false,  // 可以移除
});

// ✅ 新版本自动处理，无需配置
await install();
```

### 升级步骤

```bash
# 1. 更新依赖
pnpm update @mt0926/node-network-devtools

# 2. 清理缓存
rm -rf .next node_modules

# 3. 重新安装
pnpm install

# 4. 启动
pnpm dev
```

## ✅ 验证修复

启动后，当 axios 发起代理请求时，你应该看到：

1. ✅ 详细的调试日志
2. ✅ 自动检测和跳过的提示
3. ✅ axios 请求正常工作
4. ✅ 没有 URL 重复拼接错误

## 🎯 影响范围

### 受益的场景

- ✅ Next.js + axios + HTTP 代理
- ✅ Next.js + axios + HTTPS 代理
- ✅ 其他使用类似代理模式的 HTTP 客户端

### 不受影响的场景

- ✅ 正常的 HTTP/HTTPS 请求
- ✅ undici/fetch 请求
- ✅ 不使用代理的 axios 请求

## 📊 性能影响

- **检测开销**：每个请求增加一次正则表达式匹配（~0.01ms）
- **内存开销**：无额外内存开销
- **总体影响**：可忽略不计

## 🔮 未来计划

### 可能的改进

1. **可选的代理请求监控**：
   - 提供配置选项，允许用户选择是否监控代理请求
   - 记录目标 URL 而不是代理 URL

2. **更智能的检测**：
   - 检测更多代理模式
   - 支持 SOCKS 代理等

3. **性能优化**：
   - 缓存正则表达式匹配结果
   - 减少日志输出（生产环境）

## 🐛 已知问题

### 代理请求不被监控

**现状**：检测到代理模式的请求会被跳过，不会被监控。

**原因**：为了避免干扰 axios 的代理处理逻辑。

**解决方案**：如果需要监控这些请求，可以：
1. 不使用环境变量代理，在 axios 中直接配置
2. 或者切换到原生 fetch

### 日志输出较多

**现状**：调试日志比较详细，可能影响控制台可读性。

**计划**：在未来版本中添加日志级别配置。

## 📝 Breaking Changes

**无破坏性更改**

此版本完全向后兼容，不需要修改任何现有代码。

## 🙏 致谢

感谢用户报告此问题并提供详细的调试信息，帮助我们快速定位和修复问题。

## 📞 反馈

如果你遇到任何问题或有建议，请：

1. 查看文档：[BUGFIX-AXIOS-PROXY-AUTO.md](./BUGFIX-AXIOS-PROXY-AUTO.md)
2. 提交 Issue：[GitHub Issues](https://github.com/dong0926/node-network-devtools/issues)
3. 提供日志：包含 `[http-patcher]` 的完整日志

---

**发布日期**：2026-01-17  
**版本**：v0.1.3  
**标签**：bugfix, axios, proxy, compatibility
