# axios + HTTP 代理兼容性修复总结

## 问题描述

当用户在 Next.js 或其他环境中使用 axios + HTTP 代理时，会出现 `Invalid URL` 错误：

```
TypeError: Invalid URL
  input: 'http://127.0.0.1:7897https://httpbin.org/get'
```

## 根本原因

1. **axios 使用 `follow-redirects` 库**处理 HTTP 请求
2. **在代理模式下**，`follow-redirects` 会将完整的目标 URL 作为 `path` 参数传递给 `http.request()`
3. **`@mswjs/interceptors` 在解析请求参数时**，会将 `host`（代理地址）和 `path`（完整目标 URL）拼接在一起
4. **结果**：`http://127.0.0.1:7897` + `https://httpbin.org/get` = `http://127.0.0.1:7897https://httpbin.org/get` ❌

## 解决方案

通过 **monkey-patching `URL` 构造函数**，在 `@mswjs/interceptors` 尝试创建无效 URL 时自动检测并修复：

```typescript
// 在安装拦截器之前
const OriginalURL = globalThis.URL;

(globalThis as any).URL = function PatchedURL(url: string, base?: string | URL) {
  try {
    return new OriginalURL(url, base);
  } catch (error) {
    // 检测 axios 代理场景：http://proxy-host:port/http://target-host/path
    const duplicateUrlPattern = /^(https?:\/\/[^\/]+?)(https?:\/\/.+)$/;
    const match = url.match(duplicateUrlPattern);
    
    if (match) {
      const targetUrl = match[2];
      console.log('[http-patcher] 🔧 检测到 axios 代理 URL 错误，自动修复');
      console.log('  错误 URL:', url);
      console.log('  修复为:', targetUrl);
      
      // 使用目标 URL 重新创建
      return new OriginalURL(targetUrl, base);
    }
    
    // 其他错误继续抛出
    throw error;
  }
};
```

## 修复效果

### 修复前
```
❌ 请求失败: Invalid URL
   input: 'http://127.0.0.1:7897https://httpbin.org/get'
```

### 修复后
```
✅ 请求成功，状态码: 200
   [http-patcher] 🔧 检测到 axios 代理 URL 错误，自动修复:
     错误 URL: http://127.0.0.1:7897https://httpbin.org/get
     修复为: https://httpbin.org/get
```

## 测试验证

所有测试场景均通过：

1. ✅ **普通 axios 请求**（无代理）
2. ✅ **axios + 环境变量代理**（HTTP_PROXY/HTTPS_PROXY）
3. ✅ **axios + 配置代理**（proxy 选项）
4. ✅ **GET 请求**
5. ✅ **POST 请求**
6. ✅ **真实 API 请求**

## 优点

- ✅ **零配置**：用户无需修改代码或配置
- ✅ **自动检测**：只在检测到问题时才修复
- ✅ **不影响正常请求**：其他 URL 错误仍然正常抛出
- ✅ **完全透明**：用户无感知，请求正常执行
- ✅ **保留代理功能**：axios 的代理功能完全正常工作

## 相关文件

- `src/interceptors/http-patcher.ts` - 修复实现
- `examples/axios-proxy/` - 测试示例
- `src/interceptors/http-patcher-proxy.test.ts` - 单元测试

## 版本

修复已包含在 v0.1.3 版本中。
