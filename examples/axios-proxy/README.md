# axios + HTTP 代理测试示例

## 目的

测试 `node-network-devtools` 与 `axios` + HTTP 代理的兼容性。

## 问题描述

当同时使用以下组件时，可能出现 URL 重复拼接错误：

1. `node-network-devtools`
2. `axios`
3. HTTP 代理（`HTTP_PROXY` 环境变量）

**错误示例**：
```
TypeError: Invalid URL
input: 'http://127.0.0.1:7897http://api.example.com/path'
```

## 使用方法

### 1. 安装依赖

```bash
cd examples/axios-proxy
pnpm install
```

### 2. 运行测试

#### 无代理模式（正常）

```bash
pnpm start
```

预期结果：
- ✅ 所有请求成功
- ✅ 拦截器正常工作

#### 有代理模式（测试兼容性）

```bash
pnpm start:proxy
```

或者手动设置代理：

```bash
# Linux/macOS
export HTTP_PROXY=http://127.0.0.1:7897
pnpm start

# Windows (PowerShell)
$env:HTTP_PROXY="http://127.0.0.1:7897"
pnpm start

# Windows (CMD)
set HTTP_PROXY=http://127.0.0.1:7897
pnpm start
```

**注意**：你需要先启动一个代理服务器在 `127.0.0.1:7897`，或者修改为你的代理地址。

## 测试场景

### 测试 1：GET 请求

```javascript
await axios.get('https://httpbin.org/get');
```

### 测试 2：POST 请求

```javascript
await axios.post('https://httpbin.org/post', { test: 'data' });
```

### 测试 3：真实 API 请求

```javascript
await axios.get('https://jsonplaceholder.typicode.com/posts/1');
```

## 预期行为

### 无代理模式

- ✅ 所有请求成功
- ✅ `http-patcher` 拦截并记录请求
- ✅ 控制台显示详细的拦截日志

### 有代理模式（修复前）

- ❌ 请求失败：`ERR_INVALID_URL`
- ❌ URL 被重复拼接
- ❌ axios 无法正常工作

### 有代理模式（修复后）

- ✅ 请求成功
- ✅ `http-patcher` 自动检测代理模式并跳过拦截
- ✅ 控制台显示"检测到 URL 重复拼接"的日志
- ✅ axios 正常工作

## 调试

### 查看详细日志

运行时会输出详细的调试信息：

```
[http-patcher] 🔍 HTTP 请求拦截调试:
  请求 URL: http://127.0.0.1:7897http://api.example.com/path
  🔧 检测到 URL 重复拼接（axios + 代理场景）
  代理地址: http://127.0.0.1:7897
  目标 URL: http://api.example.com/path
  ✅ 自动修复：使用目标 URL
  ⚠️ 跳过拦截，让 axios 处理代理请求
```

### 常见问题

#### Q: 代理服务器未启动

**错误**：
```
Error: connect ECONNREFUSED 127.0.0.1:7897
```

**解决**：
1. 启动代理服务器
2. 或者使用无代理模式测试

#### Q: 没有看到拦截日志

**可能原因**：
1. 拦截器未正确安装
2. axios 请求在拦截器安装之前发生
3. axios 使用了不同的底层实现

**解决**：
- 检查 `install()` 是否在 axios 请求之前调用
- 查看控制台是否有错误信息

#### Q: 仍然出现 URL 重复拼接错误

**说明**：修复未生效

**解决**：
1. 确认使用的是最新版本（v0.1.3+）
2. 重新构建：`pnpm build`
3. 清理缓存：`rm -rf node_modules && pnpm install`

## 相关文档

- [AXIOS-PROXY-ISSUE.md](../../AXIOS-PROXY-ISSUE.md) - 问题详细分析
- [BUGFIX-AXIOS-PROXY-AUTO.md](../../BUGFIX-AXIOS-PROXY-AUTO.md) - 自动修复说明
- [TROUBLESHOOT-URL-DUPLICATION.md](../../TROUBLESHOOT-URL-DUPLICATION.md) - 故障排查

## 贡献

如果你发现新的问题或有改进建议，请：

1. 修改此示例以重现问题
2. 提交 Issue 并附上完整的日志
3. 或者直接提交 Pull Request

## 许可

MIT
