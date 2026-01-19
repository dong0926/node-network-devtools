# 更新日志

本项目的所有重要更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 计划中
- 支持更多 HTTP 客户端库（axios、got 等）
- 请求重放功能
- 性能分析和瓶颈检测
- 导出请求数据（HAR 格式）

## [0.2.0] - 2026-01-19

### ⚠️ 重大变更
- **移除 Puppeteer 依赖**：完全移除了 Puppeteer，改为使用原生浏览器启动器，显著减小了依赖体积 (dcd7dcc)
- **架构升级**：移除了旧版 CDP 集成，采用更轻量级的方案 (29efe11)

### ✨ 新增
- **浏览器自动检测**：支持自动识别系统安装的 Chrome 和 Edge 浏览器
- **Next.js 集成优化**：增强了对 Next.js 应用的自动检测 (29efe11)

### 📝 文档
- **文档重构**：将文档及指南迁移至 `docs` 目录 (08e9128)

## [0.1.3] - 2026-01-17

### 修复

- **axios + HTTP 代理兼容性问题**：修复了在使用 axios + HTTP 代理时出现的 `Invalid URL` 错误
  - 通过 monkey-patching `URL` 构造函数自动检测并修复 URL 重复拼接问题
  - 零配置，用户无需修改代码
  - 完全透明，不影响正常请求
  - 详见 `AXIOS-PROXY-FIX-SUMMARY.md`

- **Next.js Webpack 警告**：修复了 Next.js 打包时的 puppeteer 和 source-map-support 警告
  - 使用 `eval` 动态加载 puppeteer 避免 Webpack 静态分析
  - 在 Next.js 配置中排除服务端模块

### 新增

- 新增 `examples/axios-proxy` 示例，演示 axios + 代理的使用场景
- 新增详细的调试日志，帮助诊断 URL 解析问题

## [0.1.0] - 2026-01-17

### 新增
- 🎉 首次发布
- 🔍 双栈拦截支持（http/https 模块和 undici/fetch API）
- 📊 Chrome DevTools Network 面板集成
- 🖥️ 内置 Web GUI 界面，实时显示网络请求
- 🔗 基于 AsyncLocalStorage 的请求追踪
- 🛡️ 敏感头自动脱敏（Authorization、Cookie 等）
- ⚡ Next.js 框架支持和适配器
- 📦 完整的 TypeScript 类型定义
- 🎯 零侵入式集成（通过 CLI 或 `-r` 标志）
- 🔄 WebSocket 实时更新
- 🎨 深色/浅色主题切换
- 🔍 请求搜索和过滤功能
- ⏸️ 暂停/恢复请求捕获
- 📝 详细的请求信息展示（Headers、Payload、Response、Timing）

### 功能特性
- CLI 工具支持（`npx nnd` 短别名）
- 环境变量配置
- 编程式 API
- 请求存储和查询
- 上下文追踪 API
- 自动端口分配
- 浏览器自动打开
- 跨平台支持（Windows、macOS、Linux）

### 示例
- basic-http - 基础 HTTP 请求监听
- fetch-api - Fetch API 监听
- request-tracing - 请求追踪
- express-server - Express 服务器集成
- programmatic-api - 编程式 API 使用
- nextjs-app - Next.js App Router 完整示例

### 文档
- 完整的 README（中英文）
- 贡献指南
- 构建文档
- API 参考文档
- 框架集成指南

### 技术栈
- TypeScript 5.3+
- Vitest 测试框架
- fast-check 属性测试
- @mswjs/interceptors HTTP 拦截
- undici HTTP 客户端
- ws WebSocket 服务器
- React + Vite GUI 前端

---

## 版本说明

### 语义化版本格式
- **主版本号（MAJOR）**：不兼容的 API 变更
- **次版本号（MINOR）**：向后兼容的功能新增
- **修订号（PATCH）**：向后兼容的问题修正

### 变更类型
- **新增（Added）**：新功能
- **变更（Changed）**：现有功能的变更
- **弃用（Deprecated）**：即将移除的功能
- **移除（Removed）**：已移除的功能
- **修复（Fixed）**：错误修复
- **安全（Security）**：安全相关的修复

[未发布]: https://github.com/dong0926/node-network-devtools/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/dong0926/node-network-devtools/releases/tag/v0.2.0
[0.1.3]: https://github.com/dong0926/node-network-devtools/releases/tag/v0.1.3
[0.1.0]: https://github.com/dong0926/node-network-devtools/releases/tag/v0.1.0
