# TypeScript 集成测试项目

本项目用于测试 `@mt0926/node-network-devtools` 包的 TypeScript 类型定义。

## 测试目标

验证以下内容：

1. **类型定义导出正确**：所有主要 API 的类型都能正确导入
2. **类型完整性**：Config、IRequestStore 等类型接口完整可用
3. **类型推断**：TypeScript 能够正确推断返回值类型
4. **无类型错误**：编译时没有类型错误

## 测试的 API

- `getConfig()` / `updateConfig()` - 配置管理
- `getRequestStore()` / `createRequestStore()` - 请求存储
- `patchHttp()` / `unpatchHttp()` - HTTP 拦截器
- `patchUndici()` / `unpatchUndici()` - Undici 拦截器
- `getCDPBridge()` / `createCDPBridge()` - CDP 桥接
- `getGUIServer()` / `createGUIServer()` - GUI 服务器
- `getContextManager()` / `createContextManager()` - 上下文管理

## 运行测试

### 前置条件

确保已经构建了主包：

```bash
# 在项目根目录
pnpm build
```

### 安装依赖

```bash
cd tests/integration/ts-project
pnpm install
```

### 运行类型检查

```bash
pnpm test
```

这将执行：
1. TypeScript 编译检查（`tsc --noEmit`）
2. 编译并运行测试代码

## 预期结果

如果类型定义正确，应该看到：

```
开始 TypeScript 类型定义测试...

✓ 配置 API 类型验证通过
✓ 请求存储 API 类型验证通过
✓ 拦截器 API 类型验证通过
✓ CDP 桥接 API 类型验证通过
✓ GUI 服务器 API 类型验证通过
✓ 上下文管理 API 类型验证通过
✓ 类型推断验证通过

✅ 所有 TypeScript 类型定义测试通过！
类型定义正确且无错误。
```

## 验证的需求

本测试验证以下需求：

- **需求 2.5**：Package Exports 为所有导出路径提供 TypeScript 类型定义
- **需求 5.3**：构建系统保持 TypeScript 类型定义的位置和结构不变

## 故障排查

### 类型定义找不到

如果遇到 "Cannot find module" 错误：

1. 确保已经运行 `pnpm build` 构建主包
2. 检查 `dist/types` 目录是否存在
3. 检查 `package.json` 的 `exports` 字段中的 `types` 路径

### 类型错误

如果遇到类型错误：

1. 检查导入的类型名称是否正确
2. 确保使用的是最新的类型定义
3. 查看 `dist/types/index.d.ts` 文件确认导出的类型

### 编译错误

如果 TypeScript 编译失败：

1. 检查 `tsconfig.json` 配置是否正确
2. 确保 TypeScript 版本兼容（>= 5.3）
3. 运行 `pnpm install` 确保依赖已安装
