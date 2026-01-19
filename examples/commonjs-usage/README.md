# CommonJS 使用示例

演示如何在 CommonJS 模块系统中使用 `node-network-devtools`。

## 📦 关于 CommonJS

CommonJS 是 Node.js 的传统模块系统，使用 `require()` 和 `module.exports` 语法。本示例展示了如何在 CommonJS 环境中使用 node-network-devtools。

## ⚠️ 注意事项

**本工具仅用于开发环境**，不推荐在生产环境使用。

## 前置要求

- Node.js >= 18.0.0
- Puppeteer（会自动安装）

## 安装

```bash
pnpm install
```

这会自动安装 Puppeteer 和其他依赖。

## 运行方式

### 方式 1: 手动导入（推荐用于学习）

```bash
pnpm start
```

这种方式在代码中手动导入和配置：

```javascript
const { getRequestStore, patchHttp, patchUndici } = require('@mt0926/node-network-devtools');

// 手动启用拦截器
patchHttp();
patchUndici();
```

### 方式 2: 自动注册（推荐用于生产）

```bash
pnpm start:register
```

或直接使用：

```bash
node -r @mt0926/node-network-devtools/register index.js
```

这种方式会自动注册拦截器，无需在代码中手动配置。

## CommonJS vs ESM

### CommonJS 导入语法

```javascript
// 导入主入口
const nnd = require('@mt0926/node-network-devtools');
const { getRequestStore, patchHttp } = require('@mt0926/node-network-devtools');

// 自动注册
require('@mt0926/node-network-devtools/register');
```

### ESM 导入语法

```javascript
// 导入主入口
import * as nnd from '@mt0926/node-network-devtools';
import { getRequestStore, patchHttp } from '@mt0926/node-network-devtools';

// 自动注册
import '@mt0926/node-network-devtools/register';
```

## 配置选项

所有配置选项通过环境变量设置：

### 禁用自动打开浏览器

```bash
NND_AUTO_OPEN=false pnpm start
```

然后手动访问显示的 URL。

### 自定义窗口大小

```bash
NND_BROWSER_WIDTH=1920 NND_BROWSER_HEIGHT=1080 pnpm start
```

### 完全禁用 GUI（生产环境）

```bash
NND_GUI_ENABLED=false pnpm start
```

### 自定义端口

```bash
NND_GUI_PORT=8080 NND_WS_PORT=8081 pnpm start
```

### 配置拦截器

```bash
# 只拦截 HTTP
NND_INTERCEPT_HTTP=true NND_INTERCEPT_UNDICI=false pnpm start

# 只拦截 Undici/Fetch
NND_INTERCEPT_HTTP=false NND_INTERCEPT_UNDICI=true pnpm start
```

## 查看结果

启动后会自动打开极简浏览器窗口，显示：
- 请求列表（状态、方法、URL、大小、耗时）
- 请求详情（Headers、Payload、Response、Timing）
- 过滤和搜索功能
- 实时更新

## 示例请求

本示例会发起以下请求：

1. `GET /api/users` - 获取用户列表
2. `POST /api/users` - 创建新用户
3. `PUT /api/users/1` - 更新用户
4. `DELETE /api/users/1` - 删除用户
5. `GET httpbin.org/get` - 外部 API 请求

## 编程式 API

除了自动注册，你还可以使用编程式 API：

```javascript
const { 
  getRequestStore,
  getConfig,
  updateConfig,
  patchHttp,
  patchUndici,
  unpatchHttp,
  unpatchUndici,
  getGUIServer,
  getCDPBridge
} = require('@mt0926/node-network-devtools');

// 更新配置
updateConfig({
  maxRequests: 500,
  maxBodySize: 2 * 1024 * 1024, // 2MB
  guiEnabled: true,
  autoOpen: true
});

// 手动启用拦截器
patchHttp();
patchUndici();

// 获取请求存储
const store = getRequestStore();
const requests = store.getAll();

// 查询请求
const filtered = store.query({
  method: 'POST',
  url: '/api/users'
});

// 清空存储
store.clear();

// 禁用拦截器
unpatchHttp();
unpatchUndici();
```

## 与 ESM 的兼容性

`node-network-devtools` 是一个 **Dual Package**，同时支持 CommonJS 和 ESM：

- **CommonJS 环境**: 自动使用 `dist/cjs/` 构建产物
- **ESM 环境**: 自动使用 `dist/esm/` 构建产物
- **TypeScript**: 两种环境都有完整的类型定义

你可以在同一个项目中混合使用两种模块系统（虽然不推荐）。

## 故障排查

### 错误: ERR_PACKAGE_PATH_NOT_EXPORTED

如果遇到此错误，请确保：

1. 已安装最新版本的 `@mt0926/node-network-devtools`
2. `package.json` 中 `"type": "commonjs"` 已设置
3. 使用 `require()` 而不是 `import`

### 类型定义找不到

如果 TypeScript 找不到类型定义：

1. 确保已安装 `@types/node`
2. 检查 `tsconfig.json` 中的 `moduleResolution` 设置
3. 尝试重启 TypeScript 服务器

### 拦截器未生效

如果请求没有被拦截：

1. 确保在发起请求**之前**调用了 `patchHttp()` 或 `patchUndici()`
2. 检查环境变量 `NND_INTERCEPT_HTTP` 和 `NND_INTERCEPT_UNDICI`
3. 查看控制台是否有错误信息

## 相关示例

- [基础 HTTP 示例](../basic-http/) - ESM 环境的基础用法
- [Express 集成](../express-server/) - Express 框架集成
- [Fetch API 示例](../fetch-api/) - Fetch API 拦截
- [编程式 API](../programmatic-api/) - 完整的 API 使用示例

## 更多信息

- [项目主页](../../README.zh-CN.md)
- [常见问题](../../docs/guides/faq.md)
- [故障排查](../../docs/troubleshooting/common-issues.md)
