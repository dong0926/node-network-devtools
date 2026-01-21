## ADDED Requirements

### Requirement: Zero-intrusion Registration
用户 SHALL 能够通过 Node.js 的 `--import` 或 `-r` 参数启用工具，而无需修改源代码。

#### Scenario: Register via command line
- **WHEN** 运行 `node --import node-network-devtools/register app.js`
- **THEN** 工具自动初始化并开始拦截请求

### Requirement: CLI Execution
工具 SHALL 提供一个命令行包装器，简化调试启动流程。

#### Scenario: Start app via nnd command
- **WHEN** 运行 `nnd app.js`
- **THEN** 工具自动注入必要的参数并启动用户应用程序
