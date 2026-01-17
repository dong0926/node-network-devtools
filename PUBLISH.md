# 发布指南

本文档提供了将 node-network-devtools 发布到 GitHub 和 npm 的完整步骤。

## 📋 发布前检查清单

### 1. 更新项目信息

- [ ] 更新 `package.json` 中的 `author` 字段
  ```json
  "author": "ddddd <your.email@example.com>"
  ```

- [ ] 更新 `package.json` 中的 `repository` URL
  ```json
  "repository": {
    "type": "git",
    "url": "https://github.com/dong0926/node-network-devtools.git"
  }
  ```

- [ ] 更新 `LICENSE` 文件中的版权信息
  ```
  Copyright (c) 2026 ddddd
  ```

- [ ] 更新 `README.md` 和 `README.zh-CN.md` 中的所有占位符：
  - [ ] GitHub 用户名/组织名
  - [ ] 邮箱地址
  - [ ] 作者名称
  - [ ] 仓库 URL

- [ ] 更新 `CONTRIBUTING.md` 中的联系信息

- [ ] 更新 `CHANGELOG.md` 中的版本链接

### 2. 代码质量检查

- [ ] 运行所有测试
  ```bash
  pnpm test:all
  ```

- [ ] 构建项目
  ```bash
  pnpm build
  ```

- [ ] 检查 TypeScript 类型
  ```bash
  pnpm build:types
  ```

- [ ] 检查构建产物
  ```bash
  ls -la dist/
  # 应该包含: esm/, types/, gui/
  ```

### 3. 文档完善

- [ ] 确保 README 示例代码可运行
- [ ] 检查所有链接是否有效
- [ ] 添加实际的截图（替换占位符图片）
- [ ] 确保中英文文档同步

### 4. 版本管理

- [ ] 更新 `package.json` 中的版本号
  ```bash
  # 使用 npm version 自动更新
  npm version patch  # 0.1.0 -> 0.1.1
  npm version minor  # 0.1.0 -> 0.2.0
  npm version major  # 0.1.0 -> 1.0.0
  ```

- [ ] 更新 `CHANGELOG.md`，记录本次发布的变更

### 5. Git 准备

- [ ] 提交所有更改
  ```bash
  git add .
  git commit -m "chore: prepare for v0.1.0 release"
  ```

- [ ] 创建 Git 标签
  ```bash
  git tag -a v0.1.0 -m "Release v0.1.0"
  ```

## 🚀 发布到 GitHub

### 1. 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 创建新仓库 `node-network-devtools`
3. 不要初始化 README、.gitignore 或 LICENSE（本地已有）

### 2. 推送代码

```bash
# 添加远程仓库
git remote add origin https://github.com/dong0926/node-network-devtools.git

# 推送代码和标签
git push -u origin main
git push --tags
```

### 3. 创建 GitHub Release

1. 访问仓库的 Releases 页面
2. 点击 "Draft a new release"
3. 选择刚才创建的标签（v0.1.0）
4. 填写 Release 标题和说明（可从 CHANGELOG.md 复制）
5. 点击 "Publish release"

### 4. 配置 GitHub Actions

GitHub Actions 会自动运行 CI 测试。如果需要自动发布到 npm：

1. 在 GitHub 仓库设置中添加 Secret：
   - `NPM_TOKEN`：你的 npm access token

2. 创建 Release 时会自动触发发布流程

## 📦 发布到 npm

### 1. 注册 npm 账号

如果还没有 npm 账号：
1. 访问 https://www.npmjs.com/signup
2. 注册账号

### 2. 登录 npm

```bash
npm login
# 输入用户名、密码和邮箱
```

### 3. 检查包名是否可用

```bash
npm view node-network-devtools
# 如果显示 404，说明包名可用
```

### 4. 测试发布（可选）

使用 `npm pack` 测试打包：

```bash
npm pack
# 会生成 node-network-devtools-0.1.0.tgz

# 检查包内容
tar -tzf node-network-devtools-0.1.0.tgz
```

### 5. 发布到 npm

```bash
# 确保已构建
pnpm build

# 发布
pnpm publish --access public

# 或使用 npm
npm publish --access public
```

### 6. 验证发布

```bash
# 查看包信息
npm view node-network-devtools

# 安装测试
npm install node-network-devtools
```

## 🔄 后续版本发布流程

### 1. 开发新功能

```bash
# 创建功能分支
git checkout -b feature/new-feature

# 开发和测试
# ...

# 提交更改
git commit -m "feat: add new feature"

# 合并到主分支
git checkout main
git merge feature/new-feature
```

### 2. 更新版本

```bash
# 更新版本号（自动创建 git tag）
npm version patch  # 或 minor/major

# 更新 CHANGELOG.md
# 手动编辑，记录本次变更
```

### 3. 推送和发布

```bash
# 推送代码和标签
git push origin main --tags

# 在 GitHub 创建 Release（会自动触发 npm 发布）
# 或手动发布到 npm
pnpm publish
```

## 🛠️ npm Token 配置

### 创建 npm Access Token

1. 登录 npm 网站
2. 访问 https://www.npmjs.com/settings/[username]/tokens
3. 点击 "Generate New Token"
4. 选择 "Automation" 类型
5. 复制生成的 token

### 配置 GitHub Secret

1. 访问 GitHub 仓库设置
2. 进入 "Secrets and variables" > "Actions"
3. 点击 "New repository secret"
4. 名称：`NPM_TOKEN`
5. 值：粘贴刚才复制的 token
6. 保存

## 📊 发布后任务

- [ ] 在 README 中添加实际的 npm 版本徽章
- [ ] 在 README 中添加 CI 状态徽章
- [ ] 在社交媒体分享发布信息
- [ ] 在相关社区发布公告
- [ ] 监控 GitHub Issues 和 npm 下载量
- [ ] 收集用户反馈

## 🔍 常见问题

### Q: 发布失败，提示包名已存在？
A: 更改 `package.json` 中的 `name` 字段，或在 npm 上申请包名。

### Q: 如何撤销已发布的版本？
A: 使用 `npm unpublish node-network-devtools@0.1.0`（仅限发布后 72 小时内）

### Q: 如何发布 beta 版本？
A: 使用 `npm version prerelease` 和 `npm publish --tag beta`

### Q: GitHub Actions 失败？
A: 检查 Actions 日志，确保所有测试通过，npm token 配置正确。

## 📚 参考资源

- [npm 发布文档](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [语义化版本](https://semver.org/lang/zh-CN/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)

---

祝发布顺利！🎉
