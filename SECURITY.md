# 安全策略

## 🔒 支持的版本

我们目前支持以下版本的安全更新：

| 版本 | 支持状态 |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## 🐛 报告漏洞

我们非常重视安全问题。如果你发现了安全漏洞，请**不要**通过公开的 GitHub issue 报告。

### 报告流程

1. **私密报告**：请通过以下方式之一报告：
   - 发送邮件到：your.email@example.com
   - 使用 GitHub 的私密漏洞报告功能（如果可用）

2. **包含信息**：
   - 漏洞的详细描述
   - 复现步骤
   - 受影响的版本
   - 可能的影响范围
   - 如果有的话，提供修复建议

3. **响应时间**：
   - 我们会在 **48 小时内**确认收到你的报告
   - 我们会在 **7 天内**提供初步评估
   - 我们会在 **30 天内**发布修复（取决于严重程度）

### 安全更新流程

1. **评估**：我们会评估漏洞的严重程度和影响范围
2. **修复**：开发并测试修复方案
3. **发布**：发布包含修复的新版本
4. **公告**：在修复发布后，我们会公开披露漏洞详情

## 🛡️ 安全最佳实践

### 使用建议

1. **保持更新**：始终使用最新版本
   ```bash
   npm update node-network-devtools
   ```

2. **环境变量**：不要在代码中硬编码敏感信息
   ```bash
   # 使用环境变量
   NND_REDACT_HEADERS=authorization,cookie,x-api-key
   ```

3. **生产环境**：在生产环境中禁用调试功能
   ```bash
   NND_GUI_ENABLED=false
   NND_AUTO_CONNECT=false
   ```

4. **网络隔离**：确保 GUI 和 WebSocket 端口不对外暴露
   ```bash
   # 只监听本地
   NND_GUI_HOST=127.0.0.1
   ```

### 敏感数据处理

本工具会自动脱敏以下敏感头：
- `Authorization`
- `Cookie`
- `Set-Cookie`
- `Proxy-Authorization`
- `X-API-Key`

你可以通过配置添加更多需要脱敏的头：

```typescript
import { setConfig } from 'node-network-devtools';

setConfig({
  redactHeaders: [
    'authorization',
    'cookie',
    'x-api-key',
    'x-custom-token',
  ],
});
```

## 🔍 已知限制

1. **请求体大小**：默认限制为 1MB，超过的部分会被截断
2. **存储数量**：默认最多存储 1000 个请求
3. **WebSocket 安全**：WebSocket 连接未加密，仅用于本地开发

## 📋 安全检查清单

在部署到生产环境前，请确保：

- [ ] 已禁用 GUI 功能（`NND_GUI_ENABLED=false`）
- [ ] 已禁用自动连接 CDP（`NND_AUTO_CONNECT=false`）
- [ ] 已配置敏感头脱敏
- [ ] 已限制请求体大小
- [ ] 已限制存储的请求数量
- [ ] 未暴露调试端口到公网
- [ ] 已审查日志输出，确保不包含敏感信息

## 🤝 安全贡献

如果你想为项目的安全性做出贡献：

1. 审查代码中的安全问题
2. 改进安全文档
3. 提供安全最佳实践建议
4. 帮助测试安全修复

## 📚 参考资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js 安全最佳实践](https://nodejs.org/en/docs/guides/security/)
- [npm 安全最佳实践](https://docs.npmjs.com/packages-and-modules/securing-your-code)

## 📞 联系方式

- 安全问题：your.email@example.com
- 一般问题：https://github.com/dong0926/node-network-devtools/issues

---

感谢你帮助保持 node-network-devtools 的安全！🙏
