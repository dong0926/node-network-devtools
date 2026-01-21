# cli-and-registration Specification

## Purpose
TBD - created by archiving change initialize-core-specifications. Update Purpose after archive.
## Requirements
### Requirement: Zero-intrusion Registration
用户 SHALL 能够通过 Node.js 的 `--import` 或 `-r` 参数启用工具，而无需修改源代码。

#### Scenario: Register via command line
- **WHEN** 运行 `node --import node-network-devtools/register app.js`
- **THEN** 工具自动初始化并开始拦截请求

