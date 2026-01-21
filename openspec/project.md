# Project Context

## Purpose
`node-network-devtools` 是一个专门为 Node.js 开发者设计的网络请求监控工具。它的主要目标是提供类似于 Chrome DevTools 的网络请求分析体验，通过拦截 Node.js 进程中的 HTTP(S) 请求（包括传统的 `http` 模块和现代的 `fetch`/`undici`），并将其展示在一个内置的 Web GUI 或 Chrome 开发者工具中，从而简化后端网络交互的调试过程。

## Tech Stack
- **核心语言**: TypeScript (用于类型安全和现代开发体验)
- **拦截技术**: 
  - `@mswjs/interceptors`: 用于拦截 Node.js 的原生 `http`/`https` 模块。
  - `undici`: 使用其提供的 API 拦截 `fetch` 请求。
- **并发管理**: `AsyncLocalStorage` 用于跨异步调用的请求追踪 (Trace Propagation)。
- **GUI 界面**: 
  - **前端**: React 18, Tailwind CSS, Vite (极简、响应式、类似 DevTools 的 UI)。
  - **后端**: Node.js + WebSocket (`ws`) 实现请求数据的实时推送。
  - **展示**: Puppeteer (用于在 Windows/macOS/Linux 上启动无边框的极简浏览器窗口)。
- **构建工具**: TypeScript (`tsc`), Vitest (单元测试和集成测试)。

## Project Conventions

### Code Style
- **TypeScript 为主**: 严格的类型定义，优先使用 `interface` 定义 API 契约。
- **模块化**: 核心逻辑按功能划分到 `src/` 下的子目录（如 `interceptors`, `store`, `gui`, `context`）。
- **ESM 优先**: 项目配置为 `type: "module"`，但在发布时通过脚本 (`scripts/create-cjs-package.js`) 同时支持 CommonJS 以确保最大的兼容性。
- **命名规范**: 文件名使用 `kebab-case.ts`，测试文件使用 `.test.ts` 或 `.node-test.mjs` 后缀。
- **Prettier**: 使用项目根目录下的 `.prettierrc` 进行代码格式化。

### Architecture Patterns
- **拦截器模式 (Interceptor Pattern)**: 核心功能是通过补丁 (Patcher) 拦截底层网络模块，并将数据转发给中央存储。
- **环形缓冲区 (Ring Buffer)**: `src/store/ring-buffer.ts` 实现了一个固定大小的缓冲区来存储最近的请求，防止在监控高频请求时内存溢出。
- **事件驱动 (Event-driven)**: 通过 `EventBridge` 将拦截到的请求事件解耦，并实时分发给 WebSocket 客户端。
- **自动注册 (Auto-registration)**: 提供 `register.ts` 允许用户通过 `node --import` 或 `node -r` 零代码侵入地启用工具。

### Testing Strategy
- **多层次测试**:
  - **单元测试**: 使用 Vitest 测试工具类和基础组件。
  - **性能/鲁棒性测试**: 使用 `fast-check` 进行基于属性的测试 (Property-based testing)，尤其是在构建一致性检查方面。
  - **节点测试**: 使用 `.node-test.mjs` 调用 Node.js 自带的测试运行器，验证拦截器在原生环境下的表现。
- **构建验证**: 专门的 `scripts/verify-build.js` 确保打包后的文件结构和导出完整。

### Git Workflow
- **Conventional Commits**: 虽然没有硬性强制，但倾向于清晰的提交记录。
- **分支管理**: 常见的 GitHub 工作流（功能分支 -> PR -> 主分支）。

## Domain Context
- **CDP (Chrome DevTools Protocol)**: 模拟 CDP 事件以支持 Chrome DevTools 接入。
- **Instrumentation**: 在 Next.js 等框架中，利用其提供的生命周期钩子（如 `instrumentation.ts`）进行注入。
- **跨环境兼容性**: 必须同时兼容 Node.js 18+ 的各种环境，包括不同的模块系统 (ESM/CJS) 和流行的框架 (Next.js, Express)。

## Important Constraints
- **仅限开发环境**: 严禁在生产环境运行，因为拦截和存储请求 body 会带来性能损耗。
- **最小化侵入**: 尽量不修改用户的业务代码，通过环境变量或 CLI 命令启动。
- **单机使用**: 设计目标是本地开发调试，暂不考虑分布式请求追踪。

## External Dependencies
- `@mswjs/interceptors`: 底层拦截核心。
- `undici`: Node.js 标准 `fetch` 实现的基础。
- `ws`: 高效的 WebSocket 实现。
- `puppeteer`: GUI 窗口的载体（可选依赖，运行时按需安装说明）。
