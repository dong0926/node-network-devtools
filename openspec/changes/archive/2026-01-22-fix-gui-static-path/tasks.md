# Tasks: Fix GUI Static Path Resolution

- [x] 改进 `src/gui/server.ts` 中的模块目录检测逻辑 (currentDirname)
- [x] 在 `src/gui/server.ts` 中实现 `resolveStaticDir` 函数，支持优先级搜索和环境变量
- [x] 更新 `GUIServerImpl` 构造函数以使用新的解析逻辑
- [x] 添加诊断日志，在找不到文件时输出搜索路径
- [x] (可选) 增加一个集成测试或单元测试，验证路径解析在模拟环境下的行为
- [x] 验证修复：在模拟的 `node_modules` 结构下运行测试
