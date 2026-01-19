# ESM 集成测试项目

这是一个用于测试 `@mt0926/node-network-devtools` 在 ESM 环境中的集成测试项目。

## 目的

验证以下功能：

1. ✅ 主入口可以通过 `import` 正确导入
2. ✅ register 入口可以通过 `import` 正确导入
3. ✅ 所有必需的 API 都正确导出
4. ✅ 基本功能（配置、请求存储）正常工作
5. ✅ 拦截器可以正确启用和禁用
6. ✅ 模块格式正确（ESM）
7. ✅ 命名导入（解构导入）正常工作

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
cd tests/integration/esm-project
node index.mjs
```

或者使用 npm script：

```bash
pnpm test
```

## 预期输出

如果所有测试通过，你应该看到：

```
=== ESM 集成测试 ===

测试路径: C:\...\node-network-devtools\dist\esm

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
✓ 模块格式正确（ESM）

测试 6: 验证命名导入...
✓ 命名导入 getConfig 成功
✓ 命名导入 getRequestStore 成功
✓ 命名导入 HttpPatcher 成功

=== 所有测试通过 ✓ ===
ESM 集成测试成功完成！
```

## 测试内容

### 测试 1: 主入口导入

验证可以使用相对路径导入 `dist/esm/index.js`，并且所有必需的导出都存在：
- 配置相关：`getConfig`, `setConfig`, `resetConfig`
- 请求存储：`getRequestStore`, `resetRequestStore`, `createRequestStore`
- 上下文管理：`generateTraceId`, `getCurrentTraceId`, `startTrace` 等
- 拦截器：`HttpPatcher`, `UndiciPatcher`
- GUI 服务器：`getGUIServer`, `createGUIServer` 等
- 工具函数：`install`, `startGUI`, `stopGUI`

### 测试 2: register 入口导入

验证可以使用相对路径导入 `dist/esm/register.js`，不会抛出错误。register 入口会自动安装拦截器。

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

验证模块格式正确，确保是 ESM 格式而不是 CommonJS。

### 测试 6: 命名导入

验证 ESM 的命名导入（解构导入）功能：
```javascript
import { getConfig, getRequestStore, HttpPatcher } from '@mt0926/node-network-devtools';
```

这是 ESM 的标准用法，确保所有导出都可以通过解构方式导入。

## ESM vs CommonJS

### ESM 特性

- 使用 `import` 和 `export` 语法
- 支持顶层 `await`
- 静态分析和 tree-shaking
- 异步加载模块
- 文件扩展名通常是 `.mjs` 或在 `package.json` 中设置 `"type": "module"`

### 与 CommonJS 的区别

| 特性 | ESM | CommonJS |
|------|-----|----------|
| 导入语法 | `import` | `require()` |
| 导出语法 | `export` | `module.exports` |
| 加载方式 | 异步 | 同步 |
| 顶层 await | 支持 | 不支持 |
| Tree-shaking | 支持 | 不支持 |
| `__dirname` | 需要手动获取 | 自动提供 |
| `__filename` | 需要手动获取 | 自动提供 |

### ESM 中获取 __dirname

```javascript
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

## 故障排查

### 错误: Cannot find module

**原因**: 包未构建或路径错误

**解决方案**:
```bash
# 在项目根目录
pnpm build
```

### 错误: ERR_MODULE_NOT_FOUND

**原因**: ESM 模块路径解析问题

**解决方案**:
1. 确保使用完整的文件路径（包括 `.js` 扩展名）
2. 检查 `package.json` 的 `exports` 字段
3. 验证 `dist/esm` 目录存在

### 错误: SyntaxError: Cannot use import statement outside a module

**原因**: 文件未被识别为 ESM 模块

**解决方案**:
1. 使用 `.mjs` 扩展名
2. 或在 `package.json` 中设置 `"type": "module"`

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
- **CommonJS 集成测试** (`tests/integration/cjs-project`): 测试 CommonJS 环境
- **示例项目** (`examples/`): 演示实际使用方法

## 相关文件

- [需求文档](../../../.kiro/specs/commonjs-build-support/requirements.md)
- [设计文档](../../../.kiro/specs/commonjs-build-support/design.md)
- [任务列表](../../../.kiro/specs/commonjs-build-support/tasks.md)
- [CommonJS 集成测试](../cjs-project/)

## 验证需求

本测试验证以下需求：

- **需求 6.2**: 提供测试用例验证 ESM `import` 导入
- **需求 6.3**: 验证主入口和 `register` 入口都能正确导入
- **需求 5.1**: 验证现有 ESM 用户的代码仍然能够正常工作
- **需求 2.2**: 验证使用 `import` 导入主入口时解析到 `dist/esm/index.js`
- **需求 2.4**: 验证使用 `import` 导入 `register` 入口时解析到 `dist/esm/register.js`

## 使用示例

### 基本导入

```javascript
// 导入所有导出
import * as nnd from '@mt0926/node-network-devtools';

// 命名导入（推荐）
import { getConfig, getRequestStore, HttpPatcher } from '@mt0926/node-network-devtools';

// 导入 register（自动安装拦截器）
import '@mt0926/node-network-devtools/register';
```

### 使用配置

```javascript
import { getConfig, setConfig } from '@mt0926/node-network-devtools';

// 获取当前配置
const config = getConfig();
console.log(config);

// 更新配置
setConfig({
  maxRequests: 2000,
  maxBodySize: 2 * 1024 * 1024, // 2MB
  autoConnect: true
});
```

### 使用请求存储

```javascript
import { getRequestStore } from '@mt0926/node-network-devtools';

const store = getRequestStore();

// 获取所有请求
const requests = store.getAll();

// 按 TraceID 查询
const traceRequests = store.getByTraceId('trace-123');

// 清空存储
store.clear();
```

### 手动安装拦截器

```javascript
import { HttpPatcher, UndiciPatcher } from '@mt0926/node-network-devtools';

// 安装 HTTP 拦截器
HttpPatcher.install();

// 安装 Undici/Fetch 拦截器
UndiciPatcher.install();

// 卸载拦截器
HttpPatcher.uninstall();
UndiciPatcher.uninstall();
```

### 使用上下文追踪

```javascript
import { startTrace, getCurrentTraceId, runWithContext } from '@mt0926/node-network-devtools';

// 开始一个追踪
startTrace('my-trace-id', async () => {
  // 在这个回调中的所有请求都会关联到 'my-trace-id'
  const response = await fetch('https://api.example.com/data');
  console.log('Current TraceID:', getCurrentTraceId()); // 'my-trace-id'
});

// 使用自定义上下文
runWithContext({ traceId: 'custom-id', metadata: { user: 'john' } }, async () => {
  // 在这个回调中的所有请求都会关联到自定义上下文
  await fetch('https://api.example.com/user');
});
```

## 注意事项

1. **文件扩展名**: ESM 导入时必须包含 `.js` 扩展名（即使源文件是 `.ts`）
2. **顶层 await**: ESM 支持顶层 await，可以直接在模块顶层使用 `await`
3. **动态导入**: 可以使用 `import()` 进行动态导入
4. **循环依赖**: ESM 对循环依赖的处理比 CommonJS 更好
5. **Tree-shaking**: 使用命名导入可以获得更好的 tree-shaking 效果

## 性能考虑

- ESM 模块是异步加载的，首次加载可能比 CommonJS 稍慢
- 但 ESM 支持更好的静态分析和优化
- 现代打包工具（Vite、Rollup）对 ESM 有更好的支持
- 使用命名导入可以减少最终打包体积（tree-shaking）

## 最佳实践

1. **优先使用命名导入**: `import { getConfig } from '...'` 而不是 `import * as nnd from '...'`
2. **使用 register 入口**: 自动安装拦截器，无需手动调用
3. **配置在启动时设置**: 在应用启动时设置配置，避免运行时修改
4. **使用 TraceID**: 利用上下文追踪功能关联相关请求
5. **适当清理**: 在测试或长时间运行的应用中定期清理请求存储
