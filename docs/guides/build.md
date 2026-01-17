# 构建说明

## 完整构建

构建整个项目（包括 GUI）：

```bash
pnpm build
```

这会执行以下步骤：
1. `pnpm build:esm` - 构建 ESM 模块
2. `pnpm build:types` - 生成 TypeScript 类型定义
3. `pnpm build:gui` - 构建 Web GUI 前端

## 分步构建

### 1. 构建核心模块

```bash
pnpm build:esm
```

生成 ESM 格式的 JavaScript 文件到 `dist/esm/`

### 2. 生成类型定义

```bash
pnpm build:types
```

生成 TypeScript 类型定义文件到 `dist/types/`

### 3. 构建 GUI

```bash
pnpm build:gui
```

或者直接在 GUI 目录构建：

```bash
cd packages/gui
pnpm build
```

生成 GUI 静态资源到 `dist/gui/`

## 构建产物

构建完成后，`dist` 目录结构如下：

```
dist/
├── esm/              # ESM 模块
│   ├── index.js
│   ├── cli.js
│   ├── register.js
│   └── ...
├── types/            # TypeScript 类型定义
│   ├── index.d.ts
│   └── ...
└── gui/              # Web GUI 静态资源
    ├── index.html
    └── assets/
        ├── index.css
        └── index.js
```

## 开发模式

### 开发核心模块

```bash
# 监听模式（需要手动添加）
pnpm build:esm --watch
```

### 开发 GUI

```bash
cd packages/gui
pnpm dev
```

这会启动 Vite 开发服务器，支持热更新。

## 清理构建产物

```bash
pnpm clean
```

这会删除整个 `dist` 目录。

## 常见问题

### Q: GUI 页面显示 404 错误？

A: 确保已经构建了 GUI：

```bash
pnpm build:gui
```

### Q: 修改了 GUI 代码但没有生效？

A: 需要重新构建 GUI：

```bash
cd packages/gui
pnpm build
```

### Q: 如何只构建核心模块而不构建 GUI？

A: 使用分步构建：

```bash
pnpm build:esm
pnpm build:types
```

### Q: 构建失败怎么办？

A: 检查以下几点：
1. 确保安装了所有依赖：`pnpm install`
2. 确保 Node.js 版本 >= 18.0.0
3. 清理后重新构建：`pnpm clean && pnpm build`

## CI/CD 集成

在 CI/CD 流程中，建议使用完整构建：

```bash
# 安装依赖
pnpm install

# 完整构建
pnpm build

# 运行测试
pnpm test:all
```

## 发布前检查

发布前确保：

1. ✅ 所有代码已提交
2. ✅ 运行完整构建：`pnpm build`
3. ✅ 运行所有测试：`pnpm test:all`
4. ✅ 检查 `dist` 目录包含所有必要文件
5. ✅ 更新版本号
6. ✅ 更新 CHANGELOG

## 性能优化

### 并行构建

如果需要加速构建，可以并行执行：

```bash
# 使用 npm-run-all（需要安装）
npm-run-all --parallel build:esm build:types build:gui
```

### 增量构建

TypeScript 支持增量构建，可以加快重复构建速度：

```bash
# 已在 tsconfig 中启用 incremental: true
pnpm build:esm
```

## 故障排查

### GUI 构建失败

```bash
# 清理 GUI 缓存
cd packages/gui
rm -rf node_modules .vite dist
pnpm install
pnpm build
```

### TypeScript 编译错误

```bash
# 清理 TypeScript 缓存
rm -rf dist
rm -f tsconfig.tsbuildinfo
pnpm build
```

### 依赖问题

```bash
# 清理所有依赖并重新安装
rm -rf node_modules packages/gui/node_modules
pnpm install
```
