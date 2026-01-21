# Change: Remove CLI Execution Support

## Why
目前工具支持通过 CLI (`nnd`) 和 `--import`/`-r` 注册两种启动方式。为了简化核心逻辑，降低维护成本，并鼓励用户使用更标准、无副作用的 Node.js 注入方式，决定移除 CLI 启动支持，转而专注于增强注册注入（Register）的体验。

## What Changes
- **BREAKING**: 移除 `nnd` 和 `node-network-devtools` 命令行工具。
- 移除 `src/cli.ts` 及其相关测试文件。
- 移除 `package.json` 中的 `bin` 字段。
- 更新文档，将 `--import` 和 `-r` 作为推荐且唯一的非侵入式启动方式。

## Impact
- Affected specs: `cli-and-registration`
- Affected code: `src/cli.ts`, `src/cli.test.ts`, `package.json`, `README.md`, `README.zh-CN.md`
