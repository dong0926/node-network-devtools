## REMOVED Requirements

### Requirement: CLI Execution
**Reason**: 简化项目结构，专注于 Node.js 标准的注入方式（Register），减少 CLI 带来的环境兼容性维护。
**Migration**: 用户应改为使用 `node --import node-network-devtools/register` (ESM) 或 `node -r node-network-devtools/register` (CJS)。
