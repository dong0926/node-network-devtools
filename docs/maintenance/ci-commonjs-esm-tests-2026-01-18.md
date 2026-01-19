# CI/CD CommonJS 和 ESM 测试配置

**日期**: 2026-01-18  
**类型**: CI/CD 配置优化  
**相关规范**: `.kiro/specs/commonjs-build-support/`

## 概述

为 GitHub Actions CI 工作流添加了全面的 CommonJS 和 ESM 模块导入测试，确保双模块支持的正确性。

## 变更内容

### 1. 在 `build` job 中添加的测试步骤

#### 直接模块导入测试

添加了四个新的测试步骤，直接测试构建产物的导入功能：

1. **Test CommonJS require() import**
   - 使用 `require()` 导入 `dist/cjs/index.js`
   - 验证主入口导出的 API（如 `getRequestStore`）
   - 确保 CommonJS 格式正确工作

2. **Test CommonJS require() register**
   - 使用 `require()` 导入 `dist/cjs/register.js`
   - 验证 register 入口可以正常加载
   - 确保自动注册功能在 CommonJS 环境中工作

3. **Test ESM import**
   - 使用动态 `import()` 导入 `dist/esm/index.js`
   - 验证主入口导出的 API
   - 确保 ESM 格式正确工作

4. **Test ESM import register**
   - 使用动态 `import()` 导入 `dist/esm/register.js`
   - 验证 register 入口可以正常加载
   - 确保自动注册功能在 ESM 环境中工作

#### 测试命令示例

```bash
# CommonJS require 测试
node -e "const nnd = require('./dist/cjs/index.js'); console.log('✅ CommonJS require() works'); if (!nnd.getRequestStore) { console.error('❌ Missing exports'); process.exit(1); }"

# ESM import 测试
node --input-type=module -e "import('./dist/esm/index.js').then(nnd => { console.log('✅ ESM import works'); if (!nnd.getRequestStore) { console.error('❌ Missing exports'); process.exit(1); } });"
```

### 2. 在 `module-resolution` job 中的改进

为每个集成测试添加了更清晰的输出信息：

- 测试开始时输出 "Testing XXX project integration..."
- 测试成功时输出 "✅ XXX integration test passed"
- 提高了 CI 日志的可读性

### 3. 现有测试保持不变

保留了以下现有测试步骤：

- 构建产物验证（检查目录和文件存在）
- CJS package.json 内容验证
- Node.js 集成测试（`module-resolution-cjs.node-test.cjs` 和 `module-resolution-esm.node-test.mjs`）
- 构建结构验证（`scripts/verify-build.js`）

## 测试覆盖范围

### 构建产物验证
- ✅ `dist/esm` 目录存在
- ✅ `dist/cjs` 目录存在
- ✅ `dist/types` 目录存在
- ✅ `dist/gui` 目录存在
- ✅ `dist/cjs/package.json` 存在且内容正确

### CommonJS 导入测试
- ✅ 直接 `require()` 主入口
- ✅ 直接 `require()` register 入口
- ✅ Node.js 集成测试（`.node-test.cjs`）
- ✅ 完整的 CommonJS 项目集成测试

### ESM 导入测试
- ✅ 直接 `import()` 主入口
- ✅ 直接 `import()` register 入口
- ✅ Node.js 集成测试（`.node-test.mjs`）
- ✅ 完整的 ESM 项目集成测试

### TypeScript 集成测试
- ✅ TypeScript 项目编译
- ✅ 类型定义验证
- ✅ 编译后的代码执行

## 验证需求

此次更新满足了以下需求（来自 `requirements.md`）：

- **需求 6.4**: THE Build_System SHALL 在 CI/CD 流程中自动运行这些测试

## CI 工作流结构

```yaml
jobs:
  test:           # 在多个 Node.js 版本和操作系统上运行测试
  lint:           # TypeScript 类型检查
  build:          # 构建验证和模块导入测试（新增测试在这里）
  module-resolution: # 集成项目测试（改进了输出）
```

## 测试执行顺序

在 `build` job 中的测试执行顺序：

1. 构建项目 (`pnpm build`)
2. 检查构建产物目录
3. 验证 CJS package.json
4. **测试 CommonJS require() 主入口** ⬅️ 新增
5. **测试 CommonJS require() register** ⬅️ 新增
6. **测试 ESM import 主入口** ⬅️ 新增
7. **测试 ESM import register** ⬅️ 新增
8. 运行 Node.js 集成测试（CJS）
9. 运行 Node.js 集成测试（ESM）
10. 验证构建结构

## 优势

### 1. 早期发现问题
- 在 CI 中直接测试模块导入，无需等待集成测试
- 快速失败，快速反馈

### 2. 全面覆盖
- 测试了主入口和 register 入口
- 测试了 CommonJS 和 ESM 两种格式
- 测试了直接导入和集成项目两种场景

### 3. 清晰的错误信息
- 每个测试步骤都有明确的成功/失败消息
- 容易定位问题所在

### 4. 多环境验证
- 在 Ubuntu、Windows、macOS 上运行
- 在 Node.js 18.x、20.x、22.x 上运行

## 相关文件

- `.github/workflows/ci.yml` - CI 工作流配置
- `src/module-resolution-cjs.node-test.cjs` - CommonJS Node.js 测试
- `src/module-resolution-esm.node-test.mjs` - ESM Node.js 测试
- `tests/integration/cjs-project/` - CommonJS 集成测试项目
- `tests/integration/esm-project/` - ESM 集成测试项目
- `tests/integration/ts-project/` - TypeScript 集成测试项目
- `scripts/verify-build.js` - 构建验证脚本

## 后续维护

### 添加新的导出路径时

如果在 `package.json` 的 `exports` 字段中添加新的导出路径，需要：

1. 在 `build` job 中添加对应的测试步骤
2. 测试 CommonJS 和 ESM 两种导入方式
3. 验证导出的 API 是否正确

### 示例

```yaml
- name: Test new export path (CommonJS)
  run: |
    node -e "const module = require('./dist/cjs/new-path.js'); if (!module.expectedExport) { process.exit(1); }"

- name: Test new export path (ESM)
  run: |
    node --input-type=module -e "import('./dist/esm/new-path.js').then(m => { if (!m.expectedExport) { process.exit(1); } });"
```

## 总结

此次 CI/CD 配置更新为 CommonJS 构建支持功能提供了全面的自动化测试，确保：

- ✅ 构建产物正确生成
- ✅ CommonJS 导入正常工作
- ✅ ESM 导入正常工作
- ✅ 两种格式的 API 导出一致
- ✅ 在多个环境中验证

这些测试将在每次推送和 Pull Request 时自动运行，确保代码质量和向后兼容性。
