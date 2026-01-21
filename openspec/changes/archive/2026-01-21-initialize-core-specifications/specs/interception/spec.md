## ADDED Requirements

### Requirement: HTTP/HTTPS Interception
系统 SHALL 拦截 Node.js 原生的 `http` 和 `https` 模块发出的请求，并提取其元数据、Header 和 Body。

#### Scenario: Intercept outgoing HTTP request
- **WHEN** 应用程序调用 `http.request()` 或 `http.get()`
- **THEN** 拦截器捕获请求信息并生成对应的 `RequestData`

### Requirement: Undici/Fetch Interception
系统 SHALL 拦截使用 `undici` 或原生 `fetch` API 发出的请求。

#### Scenario: Intercept fetch request
- **WHEN** 应用程序调用全局 `fetch()`
- **THEN** 拦截器捕获请求信息并生成对应的 `RequestData`

### Requirement: Sensitive Header Redaction
系统 MUST 根据配置对捕获的敏感 Header 信息进行脱敏处理。

#### Scenario: Redact Authorization header
- **WHEN** 请求包含 `Authorization` 头部
- **THEN** 该头部的值在存储 and 显示前被替换为 `[REDACTED]`
