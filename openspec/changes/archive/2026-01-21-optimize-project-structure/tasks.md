# Tasks: 彻底清理项目结构

- [x] 移除 `src/` 目录下的所有构建相关测试 (Cleanup)
    - [x] `src/build-backward-compatibility.property.test.ts`
    - [x] `src/build-cjs-format.property.test.ts`
    - [x] `src/build-cjs-package.test.ts`
    - [x] `src/build-directory-consistency.property.test.ts`
    - [x] `src/build-exports-types-integrity.property.test.ts`
    - [x] `src/build-sourcemap-integrity.property.test.ts`
    - [x] `src/build-structure-integrity.property.test.ts`
    - [x] `src/build-verification.test.ts`
- [x] 移除冗余的 GUI 属性测试 (Cleanup)
    - [x] `src/gui/server.property.test.ts`
- [x] 移除验证脚本 (Cleanup)
    - [x] `scripts/verify-build.js`
- [x] 移除 `fast-check` 开发依赖 (Dependency Cleanup)
- [x] 更新 `package.json` 中的脚本，移除验证环节 (Process Optimization)
- [x] 更新 `openspec/project.md` 文档，简化测试策略说明 (Documentation)
- [x] 更新 `docs/PROJECT_STRUCTURE.md` 文档，反映结构优化 (Documentation)
- [x] 运行 `pnpm build` and `pnpm test:all` 验证核心功能不受影响 (Validation)
