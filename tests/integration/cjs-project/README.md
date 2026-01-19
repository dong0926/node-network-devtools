# CommonJS 集成测试项目

这是一个用于测试 `@mt0926/node-network-devtools` 在 CommonJS 环境中的集成测试项目。

## 目的

验证以下功能：

1. ✅ 主入口可以通过 `require()` 正确导入
2. ✅ register 入口可以通过 `require()` 正确导入
3. ✅ 所有必需的 API 都正确导出
4. ✅ 基本功能（配置、请求存储）正常工作
5. ✅ 拦截器可以正确启用和禁用
6. ✅ 模块格式正确（CommonJS）

## 运行测试

### 前置条件

确保已经构建了项目：

```bash
# 在项目根目录
pnpm build
```

### 运行测试

```bash
# 在项目根目录
cd tests/integration/cjs-project
node index.js
```

或者使用 npm script：

```bash
pnpm test
```

## 预期输出

如果所有测试通过，你应该看到：

```
=== CommonJS 集成测试 ===

测试路径: C:\...\node-network-devtools\dist\cjs

测试 1: 导入主入口...
✓ 主入口导入成功
✓ 所有必需的导出都存在 (19 个)

测试 2: 导入 register 入口...
[http-patcher] 🔧 开始安装 HTTP 拦截器...
[http-patcher] ✅ HTTP 拦截器安装成功
[node-network-devtools] HTTP/HTTPS 拦截器已安装
[undici-patcher] 原始 dispatcher: Agent
[undici-patcher] 拦截 Agent 已创建
[undici-patcher] 全局 dispatcher 已设置
[undici-patcher] 当前 dispatcher: Agent
[node-network-devtools] Undici/Fetch 拦截器已安装
✓ register 入口导入成功

测试 3: 验证基本功能...
✓ getConfig() 工作正常
✓ setConfig() 工作正常
✓ getRequestStore() 工作正常
✓ store.getAll() 工作正常

测试 4: 验证拦截器可以启用...
✓ HttpPatcher 存在
✓ UndiciPatcher 存在
✓ HttpPatcher.install 方法存在
✓ UndiciPatcher.install 方法存在

测试 5: 验证模块格式...
✓ 模块格式正确（CommonJS）

=== 所有测试通过 ✓ ===
CommonJS 集成测试成功完成！
```

## 测试内容

### 测试 1: 主入口导入

验证可以使用相对路径导入 `dist/cjs/index.js`，并且所有必需的导出都存在：
- 配置相关：`getConfig`, `setConfig`, `resetConfig`
- 请求存储：`getRequestStore`, `resetRequestStore`, `createRequestStore`
- 上下文管理：`generateTraceId`, `getCurrentTraceId`, `startTrace` 等
- 拦截器：`HttpPatcher`, `UndiciPatcher`
- GUI 服务器：`getGUIServer`, `createGUIServer` 等
- 工具函数：`install`, `startGUI`, `stopGUI`

### 测试 2: register 入口导入

验证可以使用相对路径导入 `dist/cjs/register.js`，不会抛出错误。register 入口会自动安装拦截器。

### 测试 3: 基本功能

验证核心 API 的基本功能：
- `getConfig()` - 获取配置
- `setConfig()` - 更新配置
- `getRequestStore()` - 获取请求存储
- `store.getAll()` - 获取所有请求

### 测试 4: 拦截器

验证拦截器类和方法存在：
- `HttpPatcher` - HTTP 拦截器类
- `UndiciPatcher` - Undici/Fetch 拦截器类
- `HttpPatcher.install()` - 安装 HTTP 拦截器
- `UndiciPatcher.install()` - 安装 Undici/Fetch 拦截器

### 测试 5: 模块格式

验证模块格式正确，确保是 CommonJS 格式而不是 ESM。

## 故障排查

### 错误: Cannot find module '@mt0926/node-network-devtools'

**原因**: 包未构建或未正确链接

**解决方案**:
```bash
# 在项目根目录
pnpm build
```

### 错误: ERR_PACKAGE_PATH_NOT_EXPORTED

**原因**: package.json 的 exports 字段配置错误

**解决方案**:
1. 检查根目录 `package.json` 的 `exports` 字段
2. 确保有 `require` 条件指向 `dist/cjs/`
3. 重新构建项目

### 错误: 某个导出不存在

**原因**: 构建产物不完整或 API 变更

**解决方案**:
1. 运行 `pnpm clean && pnpm build` 重新构建
2. 检查 `src/index.ts` 确认导出列表
3. 更新测试文件中的 `requiredExports` 列表以匹配实际导出

**当前测试的导出列表**:
- `getConfig`, `setConfig`, `resetConfig`
- `getRequestStore`, `resetRequestStore`, `createRequestStore`
- `generateTraceId`, `getCurrentTraceId`, `getCurrentContext`, `startTrace`, `runWithContext`
- `HttpPatcher`, `UndiciPatcher`
- `getGUIServer`, `resetGUIServer`, `createGUIServer`
- `install`, `startGUI`, `stopGUI`

## 与其他测试的关系

- **单元测试** (`src/*.test.ts`): 测试单个函数和类
- **属性测试** (`src/*.property.test.ts`): 测试通用属性
- **集成测试** (本项目): 测试真实的模块导入和使用场景
- **示例项目** (`examples/commonjs-usage`): 演示实际使用方法

## 相关文件

- [需求文档](../../../.kiro/specs/commonjs-build-support/requirements.md)
- [设计文档](../../../.kiro/specs/commonjs-build-support/design.md)
- [任务列表](../../../.kiro/specs/commonjs-build-support/tasks.md)
- [CommonJS 使用示例](../../../examples/commonjs-usage/)

## 验证需求

本测试验证以下需求：

- **需求 6.1**: 提供测试用例验证 CommonJS `require()` 导入
- **需求 6.3**: 验证主入口和 `register` 入口都能正确导入
