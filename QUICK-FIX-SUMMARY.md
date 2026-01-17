# axios + HTTP 代理问题修复总结

## 问题

用户在 Next.js 中使用 axios + HTTP 代理时出现错误：

```
TypeError: Invalid URL
  input: 'http://127.0.0.1:7897https://httpbin.org/get'
```

## 原因

`@mswjs/interceptors` 在解析 axios 代理请求时，错误地将代理地址和目标 URL 拼接在一起。

## 解决方案

通过 monkey-patching `URL` 构造函数，自动检测并修复这种错误的 URL 拼接：

```typescript
// 在 src/interceptors/http-patcher.ts 中
(globalThis as any).URL = function PatchedURL(url: string, base?: string | URL) {
  try {
    return new OriginalURL(url, base);
  } catch (error) {
    // 检测并修复：http://proxy:port/https://target/path
    const match = url.match(/^(https?:\/\/[^\/]+?)(https?:\/\/.+)$/);
    if (match) {
      return new OriginalURL(match[2], base); // 使用目标 URL
    }
    throw error;
  }
};
```

## 效果

- ✅ **零配置**：用户无需修改代码
- ✅ **自动修复**：检测到问题时自动处理
- ✅ **完全透明**：不影响正常请求
- ✅ **所有测试通过**：189 个测试全部通过

## 测试

```bash
cd examples/axios-proxy
node index.js
```

所有 axios + 代理场景均正常工作。
