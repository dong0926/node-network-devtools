## Context
项目已经有成熟的实现，当前的重点是将实现逻辑逆向整理为规范。

## Goals
- 为核心模块建立明确的行为描述和验收场景。
- 统一术语（如 TraceID, EventBridge, Patcher）。

## Decisions
- **分模块规范**: 按照功能边界拆分为多个 Capability，而不是一个巨大的 `spec.md`。
- **基于现状**: 规范应准确反映当前代码的行为，暂时不引入新功能。
