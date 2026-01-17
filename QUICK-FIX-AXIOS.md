# 快速修复：axios + 代理 URL 重复问题

## 🚨 问题

使用 `node-network-devtools` + `axios` + HTTP 代理时出现：

```
TypeError: Invalid URL
input: 'http://127.0.0.1:7897http://api.pl2w.top/...'
```

## ⚡ 快速修复（30 秒）

### 步骤 1：修改 instrumentation.ts

```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { install, setConfig } = await import('@mt0926/node-network-devtools');
    
    // 🔧 添加这个配置
    setConfig({
      interceptHttp: false,    // 禁用 HTTP 拦截器
      interceptUndici: true,   // 保留 undici 拦截器
    });
    
    await install();
  }
}
```

### 步骤 2：重启

```bash
# 清理缓存
rm -rf .next

# 重启
pnpm dev
```

### 步骤 3：验证

✅ axios 请求应该正常工作  
✅ 没有 URL 重复错误  
✅ Next.js fetch 请求仍然被监控

## 🎯 原理

- `interceptHttp: false` 禁用了 `@mswjs/interceptors`
- 避免了拦截器干扰 axios 的代理处理
- `interceptUndici: true` 保留了对 Next.js fetch 的监控

## 📚 详细文档

- **AXIOS-PROXY-ISSUE.md** - 完整的问题分析和多种解决方案
- **TROUBLESHOOT-URL-DUPLICATION.md** - 故障排查指南

## 💡 其他方案

### 方案 A：使用环境变量

```bash
NND_INTERCEPT_HTTP=false pnpm dev
```

### 方案 B：切换到原生 fetch

```typescript
// 替换 axios
const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

### 方案 C：移除代理

```bash
unset HTTP_PROXY
unset HTTPS_PROXY
pnpm dev
```

## ✅ 完成！

问题应该已经解决。如果还有问题，请查看 **AXIOS-PROXY-ISSUE.md** 获取更多解决方案。
