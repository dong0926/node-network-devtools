# Proposal: 彻底清理项目结构，聚焦核心功能

## Goal
通过彻底移除冗余的构建验证测试（build-*.ts）和过于复杂的脚本，简化项目结构。我们将停止对构建工具（tsc）行为的过度测试，将精力集中在核心业务逻辑的开发与单元测试上。

## Context
当前项目存在严重的“过度测试”问题，`src/` 目录下充斥着验证构建产物格式的测试文件。这些文件验证的是编译器行为而非业务逻辑，造成了严重的目录噪音和维护负担。

## Proposed Changes
1. **彻底移除构建验证测试**: 删除 `src/` 目录下所有 `build-*.ts` 文件（包括 property tests 和普通单元测试）。
2. **移除冗余脚本**: 移除 `scripts/verify-build.js`，信任标准的构建流程（tsc）。
3. **移除 GUI 冗余测试**: 移除 `src/gui/server.property.test.ts`，仅保留核心的 `server.test.ts`。
4. **清理开发依赖**: 从 `package.json` 中彻底移除 `fast-check`。
5. **精简构建流程**: 简化 `package.json` 中的脚本，移除不再需要的验证环节。
6. **同步更新文档**: 更新 `openspec/project.md` 和 `docs/PROJECT_STRUCTURE.md`，反映这一极简主义的测试策略。

## Expected Outcome
- `src/` 目录回归本质，仅包含核心功能代码及其对应的业务单元测试。
- 开发流程极大简化，移除无关的干扰项。
- 减少维护负担和 CI 运行时间。

