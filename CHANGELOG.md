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

## [0.2.0] - 2026-01-18

### 💥 破坏性变更

- **移除 CDP/Inspector 集成**
  - 删除 `src/cdp/` 目录及所有相关代码
  - 移除 `autoConnect` 配置项
  - 移除 `inspectorPort` 配置项
  - 移除 `NND_AUTO_CONNECT` 环境变量
  - 移除 `NND_INSPECTOR_PORT` 环境变量
  - 从 API 中移除所有 CDP 相关导出（`getCDPBridge`、`createCDPBridge`、`resetCDPBridge`、`isInspectorEnabled` 等）
  - 不再需要 `--inspect` 标志

- **强制使用 Puppeteer**
  - 移除默认浏览器支持
  - 移除 `usePuppeteer` 配置项（始终为 true）
  - 移除 `NND_USE_PUPPETEER` 环境变量
  - 移除 `open` 包依赖
  - Puppeteer 现在是 `peerDependency`（标记为可选）

### ✨ 新功能

- **极简浏览器窗口**
  - 使用 Puppeteer app 模式启动
  - 无地址栏、工具栏、菜单栏
  - 类似独立应用的沉浸式界面
  - 默认窗口大小 800x600

- **新增配置项**
  - `browserWindowSize`: 自定义窗口大小（宽度和高度）
  - `browserWindowTitle`: 自定义窗口标题
  - `NND_BROWSER_WIDTH`: 窗口宽度环境变量
  - `NND_BROWSER_HEIGHT`: 窗口高度环境变量
  - `NND_BROWSER_TITLE`: 窗口标题环境变量

- **改进的错误处理**
  - Puppeteer 未安装时提供清晰的错误信息和安装指引
  - Puppeteer 启动失败时提供详细的解决方案
  - 优雅降级，允许应用继续运行
  - GUI 服务器仍然可用（用户可手动访问）

- **开发环境警告**
  - 文档中明确标注"仅用于开发环境"
  - 提供生产环境禁用方法（`NND_GUI_ENABLED=false`）
  - 添加环境检测建议
  - 在 README 和文档中突出警告

### 📦 依赖变更

- **新增 peerDependency**: `puppeteer@^23.0.0`（标记为可选）
- **移除 dependency**: `open@^10.1.0`
- **新增 devDependency**: `puppeteer@^23.0.0`（用于开发和测试）

### 📝 文档更新

- 更新 README（中英文），移除 Inspector 相关说明
- 添加"⚠️ 开发环境专用工具"警告章节
- 更新所有示例项目文档
- 更新 FAQ，添加 Puppeteer 相关问题
- 更新快速开始指南
- 添加生产环境禁用说明

### 🔧 示例项目更新

- 所有 7 个示例项目添加 Puppeteer 依赖
- 移除示例中的 `--inspect` 标志
- 更新所有示例的 README
- 移除 `programmatic-api` 示例中的 CDP 相关代码

### 🎯 迁移指南

如果您从 0.1.x 版本升级：

1. **安装 Puppeteer**
   ```bash
   pnpm add puppeteer
   ```

2. **移除 --inspect 标志**
   ```bash
   # 旧方式
   node --inspect --import node-network-devtools/register app.js
   
   # 新方式
   node --import node-network-devtools/register app.js
   ```

3. **更新配置**
   - 移除 `autoConnect` 配置
   - 移除 `inspectorPort` 配置
   - 移除 `usePuppeteer` 配置
   - 可选：添加 `browserWindowSize` 配置

4. **移除 CDP 相关代码**
   ```javascript
   // ❌ 移除
   import { getCDPBridge, isInspectorEnabled } from 'node-network-devtools';
   
   // ✅ 使用
   import { startGUI } from 'node-network-devtools';
   ```

5. **生产环境禁用**
   ```javascript
   if (process.env.NODE_ENV === 'production') {
     setConfig({ guiEnabled: false });
   }
   ```

### 🚀 性能和维护性改进

- 代码库减少 500+ 行代码
- 配置选项减少 4 个
- 测试用例减少约 15%
- 依赖数量减少 1 个
- 架构更简单，维护成本更低

### ⚠️ 重要提示

- **本工具仅用于开发环境**，不推荐在生产环境使用
- 在 CI/CD 环境中，建议使用 `NND_GUI_ENABLED=false` 完全禁用工具
- Puppeteer 体积约 300MB，但可以复用项目中已有的安装


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

[未发布]: https://github.com/dong0926/node-network-devtools/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/dong0926/node-network-devtools/releases/tag/v0.1.0
