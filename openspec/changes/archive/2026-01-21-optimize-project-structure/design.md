# Design: 极简主义结构优化

## Architectural Reasoning
我们将从“防御性验证”转向“信任工具链”。
1. **信任编译器**: 只要 `tsc` 成功执行，我们即认可产物的基本格式。
2. **信任集成测试**: 产物的最终验证将由 `tests/integration/` 下的实际项目运行来承担。如果工具能在真实项目中被导入并运行，则证明其构建是正确的。
3. **消除噪音**: 源码目录（`src/`）不应包含任何关于 `dist/` 验证的内容。

## Implementation Details

### 1. 彻底删除的文件清单
- **构建测试**: 所有 `src/build-*.ts`。
- **验证脚本**: `scripts/verify-build.js`。
- **过度设计的属性测试**: `src/gui/server.property.test.ts`。

### 2. 依赖清理
- 移除 `fast-check`：该依赖目前仅用于被删除的构建测试。

### 3. 脚本简化
- 更新 `package.json` 中的 `prepublishOnly` 和 `build` 脚本，移除对 `verify-build.js` 的调用。

