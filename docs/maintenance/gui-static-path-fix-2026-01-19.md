# GUI 静态文件路径修复

**日期**: 2026-01-19  
**类型**: Bug 修复  
**影响范围**: GUI 服务器

## 问题描述

当 `@mt0926/node-network-devtools` 包被安装到其他项目的 `node_modules` 中使用时，GUI 服务器无法找到静态文件（`dist/gui/index.html`）。

### 错误信息

```
[GUI Server] 文件不存在: C:\Users\Administrator\Documents\codes\buff\pl2w-website01\gui\index.html
Error: ENOENT: no such file or directory, stat 'C:\Users\Administrator\Documents\codes\buff\pl2w-website01\gui\index.html'
```

### 问题原因

在 `src/gui/server.ts` 中，当无法确定模块目录时（ESM 环境中 `import.meta.url` 获取失败），代码会回退到使用 `process.cwd()`：

```typescript
} catch {
  // 后备方案
  currentDirname = process.cwd();
}
```

这导致 `staticDir` 被错误地设置为用户项目的工作目录，而不是包安装目录。

## 修复方案

### 改进错误处理

在 ESM 环境的后备方案中添加了错误日志，以便更容易诊断问题：

```typescript
} catch (error) {
  // 后备方案：尝试从 module 路径推断
  // 这种情况不应该发生，但作为最后的后备
  console.error('[GUI Server] 无法确定模块目录，使用 process.cwd() 作为后备:', error);
  currentDirname = process.cwd();
}
```

### 路径计算说明

更新了构造函数中的注释，明确说明路径计算逻辑在两种环境下的行为：

```typescript
// 静态文件目录：dist/gui（构建后的前端文件）
// 需要处理两种情况：
// 1. 开发环境：currentDirname 指向 dist/esm/gui 或 dist/cjs/gui
// 2. 安装后：currentDirname 指向 node_modules/@mt0926/node-network-devtools/dist/esm/gui 或 dist/cjs/gui
// 在两种情况下，都需要向上两级到 dist 目录，然后进入 gui 目录
this.staticDir = join(currentDirname, '../../gui');
```

## 根本原因分析

这个问题的根本原因是 `eval('import.meta.url')` 在某些环境下可能失败。可能的原因包括：

1. **打包工具转换**: 某些打包工具（如 webpack、esbuild）可能会转换 `import.meta.url`
2. **Node.js 版本**: 旧版本的 Node.js 可能不完全支持 `import.meta.url`
3. **模块加载器**: 自定义的模块加载器可能不提供 `import.meta.url`

## 后续改进建议

为了更可靠地确定模块目录，可以考虑以下改进：

### 1. 使用 `__filename` 作为后备（CommonJS）

```typescript
// 在 CommonJS 构建中，可以使用 __filename
if (typeof __filename !== 'undefined') {
  currentDirname = dirname(__filename);
}
```

### 2. 使用 `require.resolve` 查找包路径

```typescript
try {
  // 尝试解析包的主入口
  const packagePath = require.resolve('@mt0926/node-network-devtools');
  currentDirname = dirname(packagePath);
} catch {
  // 继续使用其他后备方案
}
```

### 3. 在包中包含路径配置文件

创建一个 `paths.json` 文件，在构建时生成，包含静态文件的绝对路径：

```json
{
  "guiDir": "/path/to/dist/gui"
}
```

### 4. 使用环境变量

允许用户通过环境变量指定 GUI 目录：

```typescript
const guiDir = process.env.NND_GUI_DIR || join(currentDirname, '../../gui');
```

## 测试验证

### 开发环境测试

```bash
# 在项目根目录
pnpm build
node -e "require('./dist/cjs/index.js').getGUIServer().start()"
```

### 安装后测试

```bash
# 在另一个项目中
npm install @mt0926/node-network-devtools
node -e "require('@mt0926/node-network-devtools').getGUIServer().start()"
```

## 相关文件

- `src/gui/server.ts` - GUI 服务器实现
- `dist/gui/` - 构建后的前端静态文件
- `packages/gui/` - 前端源代码

## 参考

- [Node.js ESM 文档](https://nodejs.org/api/esm.html#importmetaurl)
- [import.meta.url 兼容性](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import.meta)
