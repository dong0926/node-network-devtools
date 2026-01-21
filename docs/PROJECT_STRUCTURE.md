# 📁 项目结构说明

本文档说明了 node-network-devtools 项目的目录结构和文件组织。

## 🗂️ 目录结构

```
node-network-devtools/
├── .github/                      # GitHub 配置
│   ├── workflows/               # CI/CD 工作流
│   ├── ISSUE_TEMPLATE/          # Issue 模板
│   ├── pull_request_template.md # PR 模板
│   ├── CODEOWNERS              # 代码所有者
│   └── FUNDING.yml             # 赞助配置
│
├── .kiro/                       # Kiro 配置
│   ├── specs/                  # 功能规范
│   └── steering/               # 项目指导规则
│       ├── global.md          # 全局规则
│       ├── tech.md            # 技术栈说明
│       ├── structure.md       # 结构说明
│       └── product.md         # 产品概述
│
├── docs/                        # 📚 文档目录
│   ├── guides/                 # 使用指南
│   │   ├── quickstart.md      # 快速开始
│   │   ├── faq.md             # 常见问题
│   │   ├── build.md           # 构建说明
│   │   └── publish.md         # 发布指南
│   ├── troubleshooting/        # 故障排查
│   │   └── common-issues.md   # 常见问题排查
│   ├── images/                 # 文档图片（待添加）
│   ├── README.md               # 文档索引
│   └── PROJECT_STRUCTURE.md    # 本文档
│
├── examples/                    # 示例项目
│   ├── basic-http/             # 基础 HTTP 示例
│   ├── fetch-api/              # Fetch API 示例
│   ├── express-server/         # Express 集成
│   ├── nextjs-app/             # Next.js 完整示例
│   ├── programmatic-api/       # 编程式 API
│   ├── request-tracing/        # 请求追踪
│   └── README.md               # 示例说明
│
├── packages/                    # 子包
│   └── gui/                    # Web GUI 前端
│       ├── src/                # GUI 源代码
│       │   ├── components/    # React 组件
│       │   ├── hooks/         # React Hooks
│       │   └── utils/         # 工具函数
│       ├── dist/              # GUI 构建产物
│       ├── package.json       # GUI 包配置
│       ├── vite.config.ts     # Vite 配置
│       └── vitest.config.ts   # 测试配置
│
├── scripts/                     # 工具脚本
│   ├── check-version.cjs       # 版本检查
│   ├── create-cjs-package.js   # CJS 适配包创建
│   └── update-placeholders.js  # 占位符更新
│
├── src/                         # 核心源代码
│   ├── adapters/               # 框架适配器
│   │   ├── axios.ts           # Axios 适配器
│   │   └── nextjs.ts          # Next.js 适配器
│   ├── context/                # 上下文管理
│   │   └── context-manager.ts # 请求追踪
│   ├── gui/                    # GUI 服务器
│   │   ├── server.ts          # HTTP 服务器
│   │   ├── websocket-hub.ts   # WebSocket 服务器
│   │   ├── event-bridge.ts    # 事件桥接
│   │   ├── browser-launcher.ts # 浏览器启动
│   │   └── port-utils.ts      # 端口工具
│   ├── interceptors/           # 请求拦截器
│   │   ├── http-patcher.ts    # HTTP 拦截器
│   │   └── undici-patcher.ts  # Undici 拦截器
│   ├── store/                  # 数据存储
│   │   └── ring-buffer.ts     # Ring Buffer 实现
│   ├── index.ts                # 主入口
│   ├── config.ts               # 配置管理
│   ├── cli.ts                  # CLI 工具
│   └── register.ts             # 自动注册入口
│
├── templates/                   # 模板文件
│   └── instrumentation.ts      # Next.js instrumentation 模板
│
├── dist/                        # 构建产物（不提交到 Git）
│   ├── esm/                    # ESM 模块
│   ├── types/                  # TypeScript 类型定义
│   └── gui/                    # GUI 静态资源
│
├── .editorconfig               # 编辑器配置
├── .gitignore                  # Git 忽略规则
├── .npmignore                  # npm 发布忽略规则
├── .prettierrc                 # Prettier 配置
├── .prettierignore             # Prettier 忽略规则
│
├── CHANGELOG.md                # 变更日志
├── CONTRIBUTING.md             # 贡献指南
├── LICENSE                     # 开源许可证
├── README.md                   # 项目主文档（英文）
├── README.zh-CN.md             # 项目主文档（中文）
├── SECURITY.md                 # 安全策略
│
├── package.json                # 项目配置
├── pnpm-lock.yaml              # pnpm 锁文件
├── tsconfig.json               # TypeScript 基础配置
├── tsconfig.esm.json           # ESM 构建配置
├── tsconfig.types.json         # 类型定义配置
└── vitest.config.ts            # Vitest 测试配置
```

## 📝 文件说明

### 根目录文档

| 文件 | 说明 |
|------|------|
| `README.md` | 项目主文档（英文），包含功能介绍、快速开始、API 文档 |
| `README.zh-CN.md` | 项目主文档（中文） |
| `CHANGELOG.md` | 版本变更日志，记录每个版本的更新内容 |
| `CONTRIBUTING.md` | 贡献指南，说明如何参与项目开发 |
| `SECURITY.md` | 安全策略，说明如何报告安全漏洞 |
| `LICENSE` | MIT 开源许可证 |

### docs/ 目录

| 目录/文件 | 说明 |
|-----------|------|
| `guides/` | 使用指南目录 |
| `guides/quickstart.md` | 5 分钟快速开始指南 |
| `guides/faq.md` | 常见问题解答 |
| `guides/build.md` | 构建说明 |
| `guides/publish.md` | 发布指南 |
| `troubleshooting/` | 故障排查目录 |
| `troubleshooting/common-issues.md` | 常见问题排查 |
| `images/` | 文档图片目录（待添加截图） |
| `README.md` | 文档索引 |

### src/ 目录

| 目录 | 说明 |
|------|------|
| `adapters/` | 框架特定的适配器（Next.js、Axios 等） |
| `context/` | 基于 AsyncLocalStorage 的请求追踪 |
| `gui/` | GUI 服务器相关模块 |
| `interceptors/` | HTTP/Undici 请求拦截器 |
| `store/` | Ring Buffer 请求存储 |

### packages/ 目录

| 目录 | 说明 |
|------|------|
| `gui/` | Web GUI 前端（React + Vite + Tailwind CSS） |
| `gui/src/components/` | React 组件 |
| `gui/src/hooks/` | 自定义 Hooks |
| `gui/src/utils/` | 工具函数 |

### examples/ 目录

| 目录 | 说明 |
|------|------|
| `basic-http/` | 基础 HTTP 请求示例 |
| `fetch-api/` | Fetch API 示例 |
| `express-server/` | Express 集成示例 |
| `nextjs-app/` | Next.js 完整示例（包含 GUI 演示） |
| `programmatic-api/` | 编程式 API 使用示例 |
| `request-tracing/` | 请求追踪示例 |

### 2026-01-21 结构优化 (当前)

**删除的冗余项：**
- **构建相关测试**: 移除所有 `src/build-*.ts`，不再对编译器行为进行过度验证。
- **冗余脚本**: 移除 `scripts/verify-build.js`，简化构建流程。
- **过度设计的测试**: 移除 `src/gui/server.property.test.ts`。
- **开发依赖**: 移除 `fast-check`。

**优化效果：**
- ✅ `src/` 目录回归本质，仅包含核心逻辑。
- ✅ 移除噪音，提高开发效率。
- ✅ 减少 CI 运行时间。

## 📦 构建产物

`dist/` 目录包含构建后的文件（不提交到 Git）：

```
dist/
├── esm/              # ESM 格式的 JavaScript 文件
│   ├── index.js
│   ├── cli.js
│   ├── register.js
│   └── ...
├── types/            # TypeScript 类型定义
│   ├── index.d.ts
│   ├── index.d.ts.map
│   └── ...
└── gui/              # GUI 静态资源
    ├── index.html
    └── assets/
        ├── index.css
        └── index.js
```

## 🔧 配置文件

| 文件 | 说明 |
|------|------|
| `package.json` | 项目配置、依赖、脚本 |
| `tsconfig.json` | TypeScript 基础配置 |
| `tsconfig.esm.json` | ESM 构建配置 |
| `tsconfig.types.json` | 类型定义生成配置 |
| `vitest.config.ts` | Vitest 测试配置 |
| `.editorconfig` | 编辑器配置（统一代码风格） |
| `.prettierrc` | Prettier 格式化配置 |
| `.gitignore` | Git 忽略规则 |
| `.npmignore` | npm 发布忽略规则 |

## 🎯 命名约定

### 文件命名

- 源文件：`kebab-case.ts`
- 组件：`PascalCase.tsx`
- 测试文件：`kebab-case.test.ts`
- Node.js 测试：`kebab-case.node-test.mjs`


### 变量命名

- 变量/函数：`camelCase`
- 类/接口：`PascalCase`
- 常量：`UPPER_SNAKE_CASE`
- 私有成员：`_camelCase`

## 📚 相关文档

- [技术栈说明](../.kiro/steering/tech.md)
- [产品概述](../.kiro/steering/product.md)
- [贡献指南](../CONTRIBUTING.md)
- [构建说明](./guides/build.md)

---

**提示：** 如果你发现结构有改进空间，欢迎提出建议或提交 PR！
